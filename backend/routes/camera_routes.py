from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
import schemas.camera_schema as schemas
from controllers.camera_controller import CameraController

# Definindo o roteador com o prefixo e a tag correta para a documentação do Swagger (/docs)
router = APIRouter(prefix="/api/cameras", tags=["IoT - Gerenciamento de Câmeras"])


# =========================================================================
# 1. ROTAS DE CADASTRO E LISTAGEM GERAL
# =========================================================================

@router.post("/", response_model=schemas.CameraResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_camera(camera: schemas.CameraCreate, db: Session = Depends(get_db)):
    """
    Cadastra uma nova câmera vinculada a um setor industrial específico.
    """
    return CameraController.criar_nova_camera(db, camera)


@router.get("/", response_model=List[schemas.CameraResponse])
def listar_cameras(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retorna a lista completa de todas as câmeras cadastradas com paginação.
    """
    return CameraController.listar_todas(db, skip, limit)


# =========================================================================
# 2. ROTAS ESTÁTICAS / OPERAÇÕES ESPECIAIS (Devem vir ANTES dos IDs dinâmicos)
# =========================================================================

@router.get("/preview")
def testar_conexao_camera(url: str = Query(..., description="URL RTSP da câmera"), db: Session = Depends(get_db)):
    """
    Endpoint de streaming (MJPEG) para testar a conectividade do stream RTSP 
    em tempo real no modal do frontend antes de salvar ou atualizar.
    """
    return CameraController.testar_preview_rtsp(db, url)


# =========================================================================
# 3. ROTAS DINÂMICAS COM PARÂMETROS DE PATH (Deixadas por último)
# =========================================================================

@router.get("/{id_camera}", response_model=schemas.CameraResponse)
def obter_camera(id_camera: int, db: Session = Depends(get_db)):
    """
    Busca os detalhes operacionais de uma câmera específica através do seu ID.
    """
    return CameraController.buscar_por_id(db, id_camera)


@router.put("/{id_camera}", response_model=schemas.CameraResponse)
def atualizar_camera(id_camera: int, camera_update: schemas.CameraUpdate, db: Session = Depends(get_db)):
    """
    Atualiza de forma parcial os dados de uma câmera (nome, url_rtsp, status ou setor).
    """
    return CameraController.atualizar_dados(db, id_camera, camera_update)


@router.delete("/{id_camera}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_camera(id_camera: int, db: Session = Depends(get_db)):
    """
    Remove permanentemente a câmera do monitoramento do ecossistema SafeWork.
    """
    CameraController.excluir_camera(db, id_camera)
    return None  # Retornos 204 No Content exigem corpo vazio