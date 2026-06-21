from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Sub-schema para listar os métodos de pagamento na resposta (Atualizado com campos híbridos)
class MetodoPagamentoResponse(BaseModel):
    id_metodo: int
    tipo_metodo: str  # 'CARTAO' ou 'DEBITO_CONTA'
    titular_nome: Optional[str] = None
    numero_mascarado: Optional[str] = None
    data_expiracao: Optional[str] = None
    cvv_cartao: Optional[str] = None  # Adicionado para o cartão
    # Novos campos de débito em conta na resposta
    banco_codigo: Optional[str] = None
    agencia: Optional[str] = None
    conta_corrente: Optional[str] = None
    padrao: bool

    class Config:
        from_attributes = True  # Pydantic v2 (substitui o orm_mode = True)


# SCHEMA UNIFICADO: O Onboarding envia tudo isso em uma única requisição
class EmpresaCreate(BaseModel):
    # FASE 1: Dados básicos da empresa
    razao_social: str 
    cnpj: str
    senhaempresa: str = Field(..., validation_alias="senha")
    email_contato: str = Field(..., validation_alias="emailContato") # Obrigatório para o e-mail de boas-vindas
    
    # FASE 2: Plano
    id_plano: int = Field(1, validation_alias="idPlano") # Fallback plano 1 se não enviado
    
    # FASE 3: Pagamento Híbrido (Campos opcionais dependendo do método escolhido)
    tipo_metodo: str = Field("CARTAO", validation_alias="tipoMetodo")  # 'CARTAO' ou 'DEBITO'
    titular_nome: str = Field("TITULAR", validation_alias="titularNome")
    
    # Dados se escolher Cartão
    numero_mascarado: Optional[str] = Field(None, validation_alias="numeroMascarado")
    data_expiracao: Optional[str] = Field(None, validation_alias="dataExpiracao")
    token_pagamento: Optional[str] = Field(None, validation_alias="tokenPagamento")
    
    # Dados se escolher Débito em Conta
    banco_codigo: Optional[str] = Field(None, validation_alias="bancoCodigo")
    agencia: Optional[str] = Field(None, validation_alias="agencia")
    conta_corrente: Optional[str] = Field(None, validation_alias="contaCorrente")

    class Config:
        populate_by_name = True


# SCHEMA DE ATUALIZAÇÃO RECORRENTE (Mantido caso precisem trocar o método depois)
class EmpresaPagamentoUpdate(BaseModel):
    id_plano: int = Field(..., validation_alias="idPlano")
    tipo_metodo: str = Field(..., validation_alias="tipoMetodo")
    titular_nome: str = Field("TITULAR", validation_alias="titularNome")
    
    # Campos aceitos de forma opcional para Cartão ou Débito na atualização
    numero_mascarado: Optional[str] = Field(None, validation_alias="numeroMascarado")
    data_expiracao: Optional[str] = Field(None, validation_alias="dataExpiracao")
    banco_codigo: Optional[str] = Field(None, validation_alias="bancoCodigo")
    agencia: Optional[str] = Field(None, validation_alias="agencia")
    conta_corrente: Optional[str] = Field(None, validation_alias="contaCorrente")
    token_pagamento: Optional[str] = Field(None, validation_alias="tokenPagamento")

    class Config:
        populate_by_name = True


# SCHEMA DE RESPOSTA DA API
class EmpresaResponse(BaseModel):
    id_empresa: int
    id_plano: Optional[int] = None
    cnpj: str
    razao_social: str
    status_assinatura: Optional[str] = "pendente"
    data_cadastro: Optional[datetime] = Field(default_factory=datetime.now)
    
    # Retorna a lista de métodos cadastrados direto no JSON de resposta mapeando as novas colunas
    metodos_pagamento: List[MetodoPagamentoResponse] = []

    class Config:
        from_attributes = True  # Garante leitura direta de objetos do SQLAlchemy
        populate_by_name = True


