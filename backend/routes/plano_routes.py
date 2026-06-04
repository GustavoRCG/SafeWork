from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db, get_current_user
from repositories.plano_repository import PlanoRepository
from controllers.plano_controller import PlanoController
from schemas.plano_schema import PlanoCreate, PlanoResponse

router = APIRouter(prefix="/planos", tags=["Planos"])

@router.post("/", response_model=PlanoResponse, status_code=status.HTTP_201_CREATED)
def criar_plano(
    plano_in: PlanoCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user) # 🔐 Apenas admins logados criam planos
):
    repo = PlanoRepository(db)
    controller = PlanoController(repo)
    try:
        return controller.cadastrar(plano_in)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[PlanoResponse])
def listar_planos(db: Session = Depends(get_db)):
    """
    Rota pública para listar os planos disponíveis no SafeWork.
    """
    repo = PlanoRepository(db)
    controller = PlanoController(repo)
    return controller.listar_todos()