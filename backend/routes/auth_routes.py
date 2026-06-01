from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

# 🔐 Importamos o database e também o get_current_user para a segurança real
from ..database import database
from ..database.database import get_current_user 

from ..repositories.user_repository import UserRepository
from ..controllers.auth_controller import AuthController

router = APIRouter(prefix="/auth", tags=["Autenticação"])

# Schema (O que o Swagger pede)
class UserCreate(BaseModel):
    nome: str
    email: EmailStr
    password: str
    id_empresa: int
    id_perfil: int  # Conforme seu SQL: 1-Admin SafeWork, 2-RH Empresa, 3-Tecnico Seguranca
    id_funcionario: Optional[int] = None

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, db: Session = Depends(database.get_db)):
    # 1. Instancia o repositório passando a sessão do banco
    user_repository = UserRepository(db)
    
    # 2. Instancia o CONTROLADOR passando o repositório (POO pura)
    auth_controller = AuthController(user_repository)
    
    try:
        # 3. Delega toda a criação e segurança de rollback para o Controller
        result = auth_controller.create_user(user_data)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Erro ao processar registro: {str(e)}"
        )

# 🔐 Rota de Login Real (Verificação de Token do Firebase)
@router.get("/verify-session")
async def verify_session(current_user: dict = Depends(get_current_user)):
    """
    O login em si é feito no Frontend (React) via SDK do Firebase.
    Esta rota serve para o Frontend confirmar se o token é válido no Backend.
    Retorna os dados decodificados do usuário logado diretamente do Firebase.
    """
    return {
        "status": "autenticado",
        "message": "Sessão válida no SafeWork",
        "user_info": {
            "uid": current_user.get("uid"),
            "email": current_user.get("email"),
            "nome": current_user.get("name")
        }
    }