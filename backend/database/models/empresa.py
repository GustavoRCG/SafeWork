from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from ..database import Base

class Empresa(Base):
    __tablename__ = "empresas"
    __table_args__ = {"schema": "public"}

    id_empresa = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_plano = Column(Integer, ForeignKey("public.planos.id_plano"), nullable=True)
    cnpj = Column(String(18), unique=True, nullable=False)
    razao_social = Column(String(100), nullable=False)
    status_signature = Column(String(20), default="ATIVO") # Alinhado com seu SQL 'status_assinatura'
    data_cadastro = Column(DateTime(timezone=True), server_default=func.now())