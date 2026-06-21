from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database.database import Base 

class MetodoPagamento(Base):
    __tablename__ = 'metodos_pagamento'
    __table_args__ = {"schema": "public"}  # <-- ADICIONE ESSA LINHA AQUI

    id_metodo = Column(Integer, primary_key=True, autoincrement=True)
    id_empresa = Column(Integer, ForeignKey('public.empresas.id_empresa'), nullable=False)
    
    # Armazenará: 'CARTAO' ou 'DEBITO_CONTA'
    tipo_metodo = Column(String(30), nullable=False) 
    
    # ID de resposta do gateway de pagamento (Stripe, Asaas, etc.)
    token_pagamento = Column(String(255), nullable=True) 
    
    # Nome do titular (seja do cartão ou da conta bancária)
    titular_nome = Column(String(100), nullable=True) 
    
    # --- CAMPOS DE CARTÃO ---
    numero_mascarado = Column(String(20), nullable=True) 
    data_expiracao = Column(String(7), nullable=True)    
    cvv_cartao = Column(String(4), nullable=True)  
    # --- CAMPOS DE DÉBITO EM CONTA ---
    banco_codigo = Column(String(10), nullable=True)     
    agencia = Column(String(10), nullable=True)          
    conta_corrente = Column(String(20), nullable=True)   

    padrao = Column(Boolean, default=False)

    empresa = relationship("Empresa", back_populates="metodos_pagamento")