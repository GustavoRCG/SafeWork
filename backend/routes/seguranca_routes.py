import cv2
import base64
import time
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database.database import get_db
from database.models.seguranca import DeteccaoModel, CameraModel
from repositories.seguranca_repository import SegurancaRepository
from schemas.seguranca_schema import ConfigIARequest, AlertaResponse, CameraResponse
from typing import List, Dict

router = APIRouter(prefix="/api", tags=["Segurança & IA"])

# =========================================================================
# ⚙️ INICIALIZAÇÃO GLOBAL DA WEBCAM (Evita o erro de hardware ocupado)
# =========================================================================
# O Python abre a câmera uma única vez ao iniciar o servidor. 
# Compartilhamos essa mesma instância entre o Streaming MJPEG e a captura do RH!
camera_global = cv2.VideoCapture(0)

async def gerar_frames_ia_mock():
    """
    Consome a instância global da câmera de forma contínua, permitindo 
    que o streaming nunca precise fechar ou disputar hardware.
    """
    global camera_global
    while True:
        if not camera_global.isOpened():
            time.sleep(0.1)
            continue
            
        success, frame = camera_global.read()
        if not success:
            time.sleep(0.1)
            continue
            
        # 🤖 Onde o seu modelo real YOLOv11 aplicaria as inferências:
        # resultados = modelo(frame)
        # frame = resultados[0].plot() 
        
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

# =========================================================================
# 📸 ENDPOINT EXCLUSIVO PARA O CADASTRO DO RH (Captura Dinâmica)
# =========================================================================
@router.get("/monitoramento/capturar-frame")
async def capturar_frame_rh():
    """
    Bate a foto aproveitando o exato milissegundo atual da câmera global.
    Converte o frame em String Base64 compatível com o seu componente React.
    """
    global camera_global
    if not camera_global.isOpened():
        raise HTTPException(status_code=500, detail="A webcam global não está ativa ou falhou.")
        
    success, frame = camera_global.read()
    if not success:
        raise HTTPException(status_code=500, detail="Não foi possível ler o frame atual da webcam.")
        
    # Converte o frame bruto tridimensional do OpenCV em formato JPEG na memória
    ret, buffer = cv2.imencode('.jpg', frame)
    if not ret:
        raise HTTPException(status_code=500, detail="Erro interno ao codificar imagem.")
        
    # Converte os bytes do JPEG em uma String Base64 para trafegar via JSON puro
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
    # Retorna exatamente no formato padrão DataURL exigido pelo estado 'fotoCapturada' do React
    return {"imagem_base64": f"data:image/jpeg;base64,{img_base64}"}

# =========================================================================
# 1. HISTÓRICO DE ALERTAS (POSTGRESQL VIA AXIOS)
# =========================================================================
@router.get("/alertas", response_model=List[AlertaResponse])
async def obtener_historico_alertas(db: Session = Depends(get_db)):
    resultados = SegurancaRepository.listar_alertas(db)
    return [
        {
            "id": f"ALT-{det.id_deteccao}",
            "timestamp": det.data_hora.strftime("%d/%m/%Y %H:%M:%S") if det.data_hora else "Sem data",
            "camera": cam.nome_camera or f"Câmera #{cam.id_camera}",
            "classe": det.tipo_falta_epi,
            "criticidade": "Crítico" if float(det.confianca_ia or 1) > 0.75 else "Moderado",
            "status": "Pendente"
        } for det, cam in resultados
    ]

# =========================================================================
# 2. GERENCIAMENTO DE CÂMERAS
# =========================================================================
@router.get("/cameras", response_model=List[CameraResponse])
async def obtener_cameras(db: Session = Depends(get_db)):
    cameras = SegurancaRepository.listar_cameras(db)
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
async def video_stream():
    """
    Retorna o streaming de vídeo contínuo processado.
    A tag <img src="http://localhost:8000/api/video-stream" /> vai consumir aqui.
    """
    return StreamingResponse(
        gerar_frames_ia_mock(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

# =========================================================================
# 5. MÉTRICAS OPERACIONAIS DO MONITORAMENTO (CARDS SUPERIORES)
# =========================================================================
@router.get("/monitoramento/metricas")
async def obtener_metricas_monitoramento(db: Session = Depends(get_db)):
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
async def obtener_eventos_recentes(db: Session = Depends(get_db)):
    resultados = db.query(DeteccaoModel, CameraModel).\
        join(CameraModel, DeteccaoModel.id_camera == CameraModel.id_camera).\
        order_by(DeteccaoModel.data_hora.desc()).limit(5).all()
        
    return [
        {
            "id": det.id_deteccao,
            "tipo": "CRITICAL" if det.tipo_falta_epi and det.tipo_falta_epi != "Nenhum" else "INFO",
            "titulo": f"Sem {det.tipo_falta_epi}" if det.tipo_falta_epi else "Dispositivo Conectado",
            "local": cam.nome_camera or f"Câmera #{cam.id_camera}",
            "hora": det.data_hora.strftime("%H:%M:%S") if det.data_hora else "Agora"
        } for det, cam in resultados
    ]