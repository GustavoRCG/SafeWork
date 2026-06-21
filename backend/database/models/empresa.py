from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from ..database import Base
from sqlalchemy.orm import relationship  

class Empresa(Base):
    __tablename__ = "empresas"
    __table_args__ = {"schema": "public"}

    id_empresa = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_plano = Column(Integer, ForeignKey("public.planos.id_plano"), nullable=True)
    cnpj = Column(String(18), unique=True, nullable=False)
    razao_social = Column(String(100), nullable=False)
    status_assinatura = Column(String(20), default="ATIVO")
    data_cadastro = Column(DateTime(timezone=True), server_default=func.now())
    senhaempresa = Column(String(255), nullable=False)

    # Mantém a relação no plural conversando com o arquivo acima
    metodos_pagamento = relationship("MetodoPagamento", back_populates="empresa", cascade="all, delete-orphan")