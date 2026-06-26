#camera_controller.py

import cv2
import os
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from database.models.camera_model import CameraModel
import schemas.camera_schema as schemas
from fastapi.responses import StreamingResponse

class CameraController:

# =========================================================================
# LÓGICA RECONECTADA DO STREAMING DO PREVIEW RTSP VIA OPENCV
# =========================================================================
    @classmethod
    def testar_preview_rtsp(cls, db: Session, url_rtsp: str):
        """
        Inicia a captura do link RTSP e envelopa o gerador de frames em um StreamingResponse.
        """
        if not url_rtsp:
            raise HTTPException(status_code=400, detail="A URL RTSP é obrigatória.")

        # Retorna o objeto correto de Streaming que a tag <img> do React precisa ler
        return StreamingResponse(
            cls._gerar_fluxo_mjpeg(url_rtsp),
            media_type="multipart/x-mixed-replace; boundary=frame"
        )

    @staticmethod
    def _gerar_fluxo_mjpeg(url_rtsp: str):
        import os
        import time
        
        if url_rtsp.lower() == "webcam" or url_rtsp == "0":
            video_capture = cv2.VideoCapture(0, cv2.CAP_DSHOW) # Abre a webcam local direto pelo Windows
        else:
            # Fluxo normal para câmeras IP / RTSP da internet
            os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"
            video_capture = cv2.VideoCapture(url_rtsp)
            video_capture.set(cv2.CAP_PROP_BUFFERSIZE, 2)

        if not video_capture.isOpened():
            print(f"[SafeWork Admin] Falha ao tentar conectar na URL: {url_rtsp}")
            return

        try:
            while True:
                sucesso, frame = video_capture.read()
                
                if not sucesso or frame is None:
                    time.sleep(0.03)
                    continue

                # Inverte horizontalmente para o preview da webcam não ficar espelhado (opcional)
                if url_rtsp.lower() == "webcam" or url_rtsp == "0":
                    frame = cv2.flip(frame, 1)

                frame_otimizado = cv2.resize(frame, (640, 480))
                ret, jpeg_buffer = cv2.imencode('.jpg', frame_otimizado)
                if not ret:
                    continue

                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + jpeg_buffer.tobytes() + b'\r\n')
        finally:
            video_capture.release()
            print("[SafeWork Admin] Canal de preview fechado e memória limpa.")

    @staticmethod
    def criar_nova_camera(db: Session, camera_data: schemas.CameraCreate):
        # Alterado aqui para usar CameraModel
        nova_camera = CameraModel(
            id_setor=camera_data.id_setor,
            nome_camera=camera_data.nome_camera,
            url_rtsp=camera_data.url_rtsp,
            status_camera=camera_data.status_camera,
            modelo_ia_versao=camera_data.modelo_ia_versao
        )
        try:
            db.add(nova_camera)
            db.commit()
            db.refresh(nova_camera)
            return nova_camera
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao salvar a câmera no banco de dados: {str(e)}"
            )

    @staticmethod
    def listar_todas(db: Session, skip: int = 0, limit: int = 100):
        # Alterado aqui para usar CameraModel
        return db.query(CameraModel).offset(skip).limit(limit).all()

    @staticmethod
    def buscar_por_id(db: Session, id_camera: int):
        # Alterado aqui para usar CameraModel
        camera = db.query(CameraModel).filter(CameraModel.id_camera == id_camera).first()
        if not camera:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Câmera com ID {id_camera} não localizada."
            )
        return camera

    # ... manter os métodos de atualizar_dados e excluir_camera usando CameraModel ...

    @staticmethod
    def atualizar_dados(db: Session, id_camera: int, camera_update: schemas.CameraUpdate):
        camera_db = CameraController.buscar_por_id(db, id_camera)
        
        # Converte os dados enviados para um dicionário ignorando o que for None
        dados_atualizacao = camera_update.model_dump(exclude_unset=True)
        
        for chave, valor in dados_atualizacao.items():
            setattr(camera_db, chave, valor)
            
        try:
            db.commit()
            db.refresh(camera_db)
            return camera_db
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao atualizar dados da câmera: {str(e)}"
            )

    @staticmethod
    def excluir_camera(db: Session, id_camera: int):
        camera_db = CameraController.buscar_por_id(db, id_camera)
        try:
            db.delete(camera_db)
            db.commit()
            return {"detail": "Câmera removida com sucesso de forma permanente."}
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao deletar a câmera: {str(e)}"
            )