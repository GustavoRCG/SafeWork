from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db, get_current_user
from repositories.empresa_repository import EmpresaRepository
from controllers.empresa_controller import EmpresaController
from schemas.empresa_schema import EmpresaCreate, EmpresaResponse

router = APIRouter(prefix="/empresas", tags=["Empresas"])

@router.post("/", response_model=EmpresaResponse, status_code=status.HTTP_201_CREATED)
def criar_empresa(
    empresa_in: EmpresaCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user) # 🔐 Protegido por Token
):
    repo = EmpresaRepository(db)
    controller = EmpresaController(repo)
    try:
        return controller.cadastrar(empresa_in)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[EmpresaResponse])
def listar_empresas(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user) # 🔐 Protegido por Token
):
    repo = EmpresaRepository(db)
    controller = EmpresaController(repo)
    return controller.listar_todas()