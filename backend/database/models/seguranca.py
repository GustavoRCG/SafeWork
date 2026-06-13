from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, Numeric, DateTime, func
from database.database import Base

class DeteccaoModel(Base):
    __tablename__ = "deteccoes"
    __table_args__ = {"schema": "public"}

    id_deteccao = Column(Integer, primary_key=True, autoincrement=True)
    id_camera = Column(Integer, ForeignKey("public.dispositivos_cameras.id_camera"))
    id_funcionario = Column(Integer, ForeignKey("public.funcionarios.id_funcionario"), nullable=True)
    tipo_falta_epi = Column(String(50))
    path_imagem_original = Column(String(255))
    path_imagem_blur = Column(String(255))
    confianca_ia = Column(Numeric(5, 4))
    tempo_processamento_ms = Column(Integer)
    data_hora = Column(DateTime, default=func.now())

class CameraModel(Base):
    __tablename__ = "dispositivos_cameras"
    __table_args__ = {"schema": "public"}

    id_camera = Column(Integer, primary_key=True, autoincrement=True)
    id_setor = Column(Integer, ForeignKey("public.setores.id_setor", ondelete="CASCADE"))
    nome_camera = Column(String(50))
    url_rtsp = Column(String(255), nullable=False)
    status_camera = Column(String(20), default="OFFLINE")
    modelo_ia_versao = Column(String(20), default="YOLOv11")

class ConfigIAModel(Base):
    __tablename__ = "configuracao_ia"
    __table_args__ = {"schema": "public"}

    id_config = Column(Integer, primary_key=True, autoincrement=True)
    id_empresa = Column(Integer, ForeignKey("public.empresas.id_empresa", ondelete="CASCADE"), default=1)
    confianca_minima = Column(Integer, default=65)
    auditar_capacete = Column(Boolean, default=True)
    auditar_colete = Column(Boolean, default=True)
    auditar_luvas = Column(Boolean, default=False)
    alertar_zona_risco = Column(Boolean, default=True)