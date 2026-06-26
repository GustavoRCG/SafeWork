from pydantic import BaseModel, Field
from typing import Optional

# 1. BASE: Atributos comuns compartilhados por quase todos os schemas
class CameraBase(BaseModel):
    nome_camera: str = Field(..., max_length=50, description="Nome identificador da câmera")
    url_rtsp: str = Field(..., max_length=255, description="Link do stream de vídeo RTSP")
    status_camera: str = Field("Ativo", max_length=20, description="Status de operação da câmera (Ex: Ativo, Inativo)")
    id_setor: Optional[int] = Field(None, description="ID do setor industrial vinculado")
    modelo_ia_versao: Optional[str] = Field(None, max_length=20, description="Versão do modelo YOLO/Visão Computacional")

# 2. CREATE: Dados que o frontend envia no POST para criar uma nova câmera
class CameraCreate(CameraBase):
    pass  # Herda tudo da base, pois todos os campos são necessários para a inserção

# 3. UPDATE: Dados para atualizar parcialmente uma câmera via PUT/PATCH
class CameraUpdate(BaseModel):
    nome_camera: Optional[str] = Field(None, max_length=50)
    url_rtsp: Optional[str] = Field(None, max_length=255)
    status_camera: Optional[str] = Field(None, max_length=20)
    id_setor: Optional[int] = None
    modelo_ia_versao: Optional[str] = Field(None, max_length=20)

# 4. RESPONSE: Formato estrito que a API retorna ao frontend (Seu original preservado)
class CameraResponse(CameraBase):
    id_camera: int

    class Config:
        from_attributes = True  # Permite ler objetos diretos do ORM SQLAlchemy