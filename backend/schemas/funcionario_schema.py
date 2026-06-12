from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

# Dados que o Frontend/React vai enviar no POST
class FuncionarioCreate(BaseModel):
    id_empresa: int = Field(..., description="ID da empresa")
    nome: str = Field(..., max_length=100, description="Nome completo")
    cpf: str = Field(..., max_length=14, description="CPF do funcionário")
    cargo: Optional[str] = Field(None, max_length=50, description="Cargo do funcionário")
    data_admissao: Optional[date] = Field(None, description="Data de admissão (AAAA-MM-DD)")
    
    # Adicionamos estes campos aqui para o FastAPI ACEITAR o JSON do React sem dar Erro 400
    setor: Optional[str] = None
    epi_obrigatorio: Optional[str] = None
    face_id_image: Optional[str] = None  # Recebe a String Base64 da foto

# Dados que a API vai retornar para o React
class FuncionarioResponse(BaseModel):
    id_funcionario: int
    id_empresa: int
    nome: str
    cpf: str
    cargo: Optional[str]
    face_encoding: Optional[str] = None
    data_admissao: Optional[date] = None

    class Config:
        from_attributes = True