from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# O que vem do Frontend para cadastrar
class EmpresaCreate(BaseModel):
    razao_social: str = Field(..., max_length=100)
    cnpj: str = Field(..., max_length=18)
    id_plano: int

# O que a API devolve (inclui ID e campos automáticos)
class EmpresaResponse(BaseModel):
    id_empresa: int
    id_plano: int
    cnpj: str
    razao_social: str
    status_assinatura: str
    data_cadastro: datetime

    class Config:
        from_attributes = True