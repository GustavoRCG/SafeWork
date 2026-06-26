from pydantic import BaseModel
from typing import Optional


class SetorBase(BaseModel):
    id_empresa: int
    nome_setor: str
    nivel_risco: str

class SetorCreate(SetorBase):
    pass

class SetorUpdate(BaseModel):
    nome_setor: Optional[str] = None
    nivel_risco: Optional[str] = None
    id_empresa: Optional[int] = None

class SetorResponse(BaseModel):
    id_setor: int
    nome_setor: str
    id_empresa: Optional[int] = None   # Evita quebrar se o banco tiver nulo legado
    nivel_risco: Optional[str] = None  # Evita quebrar se o banco tiver nulo legado

    class Config:
        from_attributes = True