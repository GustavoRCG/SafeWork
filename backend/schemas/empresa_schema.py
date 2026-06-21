from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class EmpresaCreate(BaseModel):
   
    razao_social: str 
    cnpj: str
    senhaempresa: str = Field(..., validation_alias="senha")

    class Config:
        populate_by_name = True

class EmpresaPagamentoUpdate(BaseModel):
    id_plano: int = Field(..., validation_alias="idPlano")
    tipo_metodo: str = Field(..., validation_alias="tipoMetodo")
    titular_nome: Optional[str] = Field("CLIENTE", validation_alias="titularNome")
    numero_mascarado: Optional[str] = Field("PIX", validation_alias="numeroMascarado")

    class Config:
        populate_by_name = True

class EmpresaResponse(BaseModel):
    id_empresa: int
    id_plano: Optional[int] = None
    cnpj: str
    razao_social: str
    status_assinatura: Optional[str] = "pendente"
    data_cadastro: datetime

    class Config:
        from_attributes = True
        populate_by_name = True