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
    current_user: dict = Depends(get_current_user) # 🔐 Rota protegida!
):
    """
    Rota protegida para cadastrar um novo funcionário. 
    Requer Token JWT do Firebase no Header (Authorization: Bearer <TOKEN>).
    """
    # Se precisar do UID do usuário logado para alguma regra, ele está aqui:
    # uid_firebase = current_user.get("uid")
    
    repo = FuncionarioRepository(db)
    controller = FuncionarioController(repo)
    
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
    current_user: dict = Depends(get_current_user) # 🔐 Rota protegida!
):
    """
    Rota protegida para listar funcionários de uma empresa.
    """
    repo = FuncionarioRepository(db)
    controller = FuncionarioController(repo)
    return controller.listar_por_empresa(id_empresa)