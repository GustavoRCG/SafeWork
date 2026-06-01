from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from ..database import Base  # Busca a Base que está no database.py

class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = {"schema": "public"}

    id_usuario = Column(Integer, primary_key=True, index=True, autoincrement=True)
    firebase_uid = Column(String(128), unique=True, nullable=False)
    id_empresa = Column(Integer, nullable=False) # Se quiser chave estrangeira ativa: ForeignKey("public.empresas.id_empresa")
    id_perfil = Column(Integer, nullable=False)  # ForeignKey("public.perfis_acesso.id_perfil")
    id_funcionario = Column(Integer, nullable=True) # ForeignKey("public.funcionarios.id_funcionario")
    email = Column(String(100), unique=True, nullable=False)
    senha_hash = Column(String(255), nullable=True)
    status_usuario = Column(Boolean, default=True)
    data_criacao = Column(DateTime(timezone=True), server_default=func.now())