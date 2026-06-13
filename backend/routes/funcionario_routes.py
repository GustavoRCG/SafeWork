from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db, get_current_user # 🔐 Importando o protetor do Firebase
from repositories.funcionario_repository import FuncionarioRepository
from controllers.funcionario_controller import FuncionarioController
from schemas.funcionario_schema import FuncionarioCreate, FuncionarioResponse

router = APIRouter(prefix="/funcionarios", tags=["Funcionários"])

@router.post("/", response_model=FuncionarioResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_funcionario(
    funcionario_in: FuncionarioCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Rota protegida para cadastrar um novo funcionário.
    """
    conexao_psycopg2 = db.connection().connection
    
    controller = FuncionarioController(conexao_psycopg2)
    
    try:
        return controller.cadastrar(funcionario_in)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/empresa/{id_empresa}", response_model=List[FuncionarioResponse])
def listar_funcionarios_por_empresa(
    id_empresa: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Rota protegida para listar funcionários de uma empresa.
    """
    # 💡 Fazemos a mesma coisa aqui para a rota de listagem
    conexao_psycopg2 = db.connection().connection
    controller = FuncionarioController(conexao_psycopg2)
    
    return controller.listar_por_empresa(id_empresa)