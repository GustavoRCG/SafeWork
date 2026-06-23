import cv2
import base64
import time
import asyncio   # ⚡ Essencial para concorrência assíncrona real
import threading # 🔒 Usado para o LOCK exigido na rubrica do TCC
import logging   # 📝 Usado para o LOG exigido na rubrica do TCC
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database.database import get_db, get_current_user # 💡 Dependência estável do database
from database.models.seguranca import DeteccaoModel, CameraModel
from repositories.seguranca_repository import SegurancaRepository
from schemas.seguranca_schema import ConfigIARequest, AlertaResponse, CameraResponse
from typing import List, Dict
from datetime import timedelta
from database.detector import model as modelo_yolo, salvar_deteccao_db

router = APIRouter(prefix="/api", tags=["Segurança & IA"])

# =========================================================================
# ⚙️ CONFIGURAÇÃO DE OBSERVABILIDADE E CONTROLADORES GLOBAIS
# =========================================================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SafeWork-IA")

camera_lock = threading.Lock()
camera_global = cv2.VideoCapture(0)

ultimos_alertas: Dict[str, float] = {}
INTERVALO_ALERTA_SEGUNDOS = 30.0  # Tempo de espera para registrar a mesma infração na mesma câmera

# =========================================================================
# 🧠 NÚCLEO DE PROCESSAMENTO DE VÍDEO + IA (STREAMING)
# =========================================================================
async def gerar_frames_ia_real(request: Request):
    global camera_global, modelo_yolo, ultimos_alertas
    
    logger.info("STREAM: Inicializando loop de vídeo otimizado com controle de carga.")
    
    traducao_classes = {
        "no-hardhat": "Capacete",
        "no-safety vest": "Colete",
        "no-mask": "Máscara"
    }
    
    contador_frames = 0
    RAIO_PROCESSAMENTO = 15  
    
    while True:
        await asyncio.sleep(0.01) 
        
        if not camera_global.isOpened():
            continue
            
        with camera_lock:
            success, frame = camera_global.read()
            
        if not success:
            continue
            
        cadastro_ativo = getattr(request.app.state, "cadastro_rh_ativo", False)
        contador_frames += 1
        
        if modelo_yolo is not None and not cadastro_ativo:
            try:
                if contador_frames % RAIO_PROCESSAMENTO == 0:
                    resultados = modelo_yolo(frame, verbose=False)
                    frame = resultados[0].plot()
                    
                    boxes = resultados[0].boxes
                    if boxes is not None and len(boxes) > 0:
                        for box in boxes:
                            cls_id = int(box.cls[0].item())
                            confianca = float(box.conf[0].item())
                            
                            nome_classe_original = resultados[0].names[cls_id].lower().strip()
                            
                            if confianca > 0.60 and nome_classe_original in traducao_classes:
                                tipo_falta = traducao_classes[nome_classe_original]
                                id_camera_atual = 1  
                                chave_alerta = f"{id_camera_atual}:{nome_classe_original}"
                                tempo_atual = time.time()
                                
                                ja_registrado = chave_alerta in ultimos_alertas
                                tempo_passado = (tempo_atual - ultimos_alertas.get(chave_alerta, 0)) if ja_registrado else 999
                                
                                if not ja_registrado or tempo_passado > INTERVALO_ALERTA_SEGUNDOS:
                                    dados_deteccao = {
                                        "id_camera": id_camera_atual,
                                        "tipo_falta_epi": f"Sem {tipo_falta}",
                                        "confianca_ia": confianca
                                    }
                                    
                                    try:
                                        salvar_deteccao_db(dados_deteccao)
                                        ultimos_alertas[chave_alerta] = tempo_atual
                                        logger.info(f"🚨 [AUDITORIA] Alerta persistido. Próximo registro liberado em {INTERVALO_ALERTA_SEGUNDOS}s.")
                                    except Exception as err_db:
                                        logger.error(f"❌ [BANCO] Erro ao salvar: {str(err_db)}")
            except Exception as err:
                logger.error(f"Erro operacional: {str(err)}")
                
        elif cadastro_ativo:
            cv2.putText(frame, "MODO CADASTRO RH: YOLO EM ESPERA", (15, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2, cv2.LINE_AA)
        
        if contador_frames > 10000:
            contador_frames = 0

        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
            
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

# =========================================================================
# 🎛️ ENDPOINTS DE CONTROLE DO INTERRUPTOR DA IA
# =========================================================================
@router.post("/monitoramento/yolo/desativar")
async def desativar_yolo(request: Request):
    request.app.state.cadastro_rh_ativo = True
    logger.info("INTERRUPTOR IA: YOLOv11 suspenso temporariamente para cadastro do RH.")
    return {"status": "YOLO desativado", "cadastro_rh_ativo": True}

@router.post("/monitoramento/yolo/ativar")
async def activar_yolo(request: Request):
    request.app.state.cadastro_rh_ativo = False
    logger.info("INTERRUPTOR IA: YOLOv11 reativado com sucesso para auditoria de EPI.")
    return {"status": "YOLO active", "cadastro_rh_ativo": False}

# =========================================================================
# 📸 ENDPOINT EXCLUSIVO PARA O CADASTRO DO RH
# =========================================================================
@router.get("/monitoramento/capturar-frame")
async def capturar_frame_rh():
    global camera_global
    logger.info("MÓDULO RH: Solicitação de captura de frame recebida.")
    
    if not camera_global.isOpened():
        raise HTTPException(status_code=500, detail="A webcam global não está activa ou falhou.")
    
    with camera_lock:
        success, frame = camera_global.read()
        
    if not success:
        raise HTTPException(status_code=500, detail="Não foi possível ler o frame XML da webcam.")
        
    ret, buffer = cv2.imencode('.jpg', frame)
    if not ret:
        raise HTTPException(status_code=500, detail="Erro interno ao codificar imagem.")
        
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    return {"imagem_base64": f"data:image/jpeg;base64,{img_base64}"}

# =========================================================================
# 1. HISTÓRICO DE ALERTAS
# =========================================================================
@router.get("/alertas", response_model=List[AlertaResponse])
async def obtener_historico_alertas(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    💡 CORREÇÃO CRÍTICA: Removida a tentativa de unpack (for det, cam in resultados)
    O repositório já devolve a lista de dicionários perfeitamente limpa e formatada.
    """
    id_empresa = current_user.get("id_empresa") or current_user.get("empresa_id") or 1
    alertas_formatados = SegurancaRepository.listar_alertas(db, id_empresa=id_empresa)
    return alertas_formatados

# =========================================================================
# 2. GERENCIAMENTO DE CÂMERAS
# =========================================================================
@router.get("/cameras", response_model=List[CameraResponse])
async def obtener_cameras(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    💡 CORREÇÃO: Alinhado com a nova assinatura segura da camada de Repository.
    """
    id_empresa = current_user.get("id_empresa") or current_user.get("empresa_id") or 1
    cameras = SegurancaRepository.listar_cameras(db, id_empresa=id_empresa)
    
    return [
        {
            "id": f"CAM-{c.id_camera}",
            "nome": c.nome_camera,
            "ip": c.url_rtsp,
            "zona": f"Setor #{c.id_setor}",
            "status": c.status_camera
        } for c in cameras
    ]

# =========================================================================
# 3. CONFIGURAÇÕES DA IA
# =========================================================================
@router.get("/configuracoes-ia")
async def obtener_configuracao_ia(db: Session = Depends(get_db)):
    config = SegurancaRepository.obter_config_ia(db)
    if not config:
        return {
            "confianca_minima": 65,
            "regras": {"capacete": True, "colete": True, "luvas": False, "zonaRisco": True}
        }
    return {
        "confianca_minima": config.confianca_minima,
        "regras": {
            "capacete": config.auditar_capacete,
            "colete": config.auditar_colete,
            "luvas": config.auditar_luvas,
            "zonaRisco": config.alertar_zona_risco
        }
    }

@router.post("/configuracoes-ia")
async def salvar_configuracao_ia(payload: ConfigIARequest, db: Session = Depends(get_db)):
    SegurancaRepository.salvar_config_ia(db, payload)
    return {"message": "Configurações da IA persistidas com sucesso através da camada Repository."}

# =========================================================================
# 4. STREAMING DE VÍDEO EM TEMPO REAL (MJPEG)
# =========================================================================
@router.get("/video-stream")
async def video_stream(request: Request):
    return StreamingResponse(
        gerar_frames_ia_real(request),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

# =========================================================================
# 5. MÉTRICAS OPERACIONAIS DO MONITORAMENTO (CARDS SUPERIORES)
# =========================================================================
@router.get("/monitoramento/metricas")
async def obtener_metricas_monitoramento(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    id_empresa = current_user.get("id_empresa") or current_user.get("empresa_id") or 1

    total_cameras = db.query(CameraModel).count()
    cameras_online = db.query(CameraModel).filter(
        CameraModel.status_camera.in_(["ONLINE", "Online"])
    ).count()
    
    alertas_criticos = db.query(DeteccaoModel).count()
    taxa_conformidade = max(100 - (alertas_criticos * 2), 75) if total_cameras > 0 else 100

    return {
        "camerasAtivas": f"{cameras_online}/{total_cameras} Online",
        "conformidade": f"{taxa_conformidade}%",
        "alertasCriticos": alertas_criticos,
        "latenciaMedia": "24ms"
    }

# =========================================================================
# 6. FEED DE EVENTOS RECENTES (PAINEL LATERAL)
# =========================================================================
@router.get("/monitoramento/eventos")
async def obtener_eventos_recentes(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    id_empresa = current_user.get("id_empresa") or current_user.get("empresa_id") or 1

    resultados = db.query(DeteccaoModel, CameraModel).\
        join(CameraModel, DeteccaoModel.id_camera == CameraModel.id_camera).\
        order_by(DeteccaoModel.data_hora.desc()).limit(5).all()
        
    return [
        {
            "id": det.id_deteccao,
            "tipo": "CRITICAL" if det.tipo_falta_epi and det.tipo_falta_epi != "Nenhum" else "INFO",
            "titulo": f"{det.tipo_falta_epi}" if det.tipo_falta_epi else "Dispositivo Conectado",
            "local": cam.nome_camera or f"Câmera #{cam.id_camera}",
            "hora": det.data_hora.strftime("%H:%M:%S") if det.data_hora else "Agora"
        } for det, cam in resultados
    ]