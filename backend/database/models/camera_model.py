#models
#camera_model.py

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database.database import Base

class CameraModel(Base):
    __tablename__ = "dispositivos_cameras"

    id_camera = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_setor = Column(Integer, ForeignKey("setores.id_setor"), nullable=False)
    nome_camera = Column(String(50), nullable=False)
    url_rtsp = Column(String(255), nullable=False)
    status_camera = Column(String(20), nullable=False, default="Ativa")
    modelo_ia_versao = Column(String(20), nullable=False, default="YOLOv8")

    # Mapeamento limpo: apenas indicamos a classe alvo. 
    # O SQLAlchemy detecta a FK 'id_setor' sozinho e evita duplicidade no registro.
    setor = relationship("SetorModel", backref="cameras")