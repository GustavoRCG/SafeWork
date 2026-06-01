from sqlalchemy import Column, Integer, String, Numeric, DateTime
from sqlalchemy.sql import func
from ..database import Base

class Plano(Base):
    __tablename__ = "planos"
    __table_args__ = {"schema": "public"}

    id_plano = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome_plano = Column(String(50), nullable=False)
    tipo_cobranca = Column(String(20), nullable=False)
    preco_base = Column(Numeric(10, 2), nullable=False)
    limite_cameras = Column(Integer, nullable=True)
    limite_funcionarios = Column(Integer, nullable=True)
    data_criacao = Column(DateTime(timezone=True), server_default=func.now())