from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

# Dados que o Frontend/Swagger vai enviar no POST
class FuncionarioCreate(BaseModel):
    id_empresa: int = Field(..., description="ID da empresa à qual o funcionário pertence")
    nome: str = Field(..., max_length=100, description="Nome completo do funcionário")
    cpf: str = Field(..., max_length=14, description="CPF do funcionário (ex: 123.456.789-00)")
    cargo: Optional[str] = Field(None, max_length=50, description="Cargo do funcionário")
    data_admissao: Optional[date] = Field(None, description="Data de admissão (AAAA-MM-DD)")

# Dados que a API vai retornar após salvar no banco (inclui o ID gerado)
class FuncionarioResponse(BaseModel):
    id_funcionario: int
    id_empresa: int
    nome: str
    cpf: str
    cargo: Optional[str]
    data_admissao: Optional[date]

    class Config:
        from_attributes = True # Permite que o Pydantic leia objetos do SQLAlchemy