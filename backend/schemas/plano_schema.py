from pydantic import BaseModel, Field
from typing import Optional

# O que o Admin envia para cadastrar um plano
class PlanoCreate(BaseModel):
    nome: str = Field(..., max_length=50)
    descricao: Optional[str] = None
    limite_cameras: int = Field(..., ge=1)
    preco: float

# O que a API devolve
class PlanoResponse(BaseModel):
    id_plano: int
    nome: str
    descricao: Optional[str]
    limite_cameras: int
    preco: float

    class Config:
        from_attributes = True