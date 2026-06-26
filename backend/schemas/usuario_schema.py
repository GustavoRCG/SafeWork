#usuario_schema.py

import re
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional

# --- SCHEMAS DE PERFIL ---
class PerfilResponse(BaseModel):
    id_perfil: int
    nome_perfil: str

    class Config:
        from_attributes = True

# --- SCHEMAS DE USUÁRIO ---
class UsuarioBase(BaseModel):
    email: EmailStr
    id_perfil: int
    status_usuario: Optional[bool] = True

class UsuarioCreate(UsuarioBase):
    senha_hash: str 
    @field_validator("senha_hash")
    @classmethod
    def validar_senha_forte(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("A senha deve conter no mínimo 8 caracteres.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("A senha deve conter pelo menos uma letra maiúscula.")
        if not re.search(r"[a-z]", v):
            raise ValueError("A senha deve conter pelo menos uma letra minúscula.")
        if not re.search(r"[0-9]", v):
            raise ValueError("A senha deve conter pelo menos um número.")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("A senha deve conter pelo menos um caractere especial (Ex: !@#$).")
        return v
    
class UsuarioUpdate(BaseModel):
    id_perfil: Optional[int] = None
    status_usuario: Optional[bool] = None

class UsuarioResponse(BaseModel):
    id_usuario: int
    email: str
    firebase_uid: str
    id_perfil: int
    status_usuario: bool

    class Config:
        from_attributes = True