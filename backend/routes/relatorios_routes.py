from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
# Ajuste as importações conforme os nomes do seu projeto
from database.database import get_db, get_current_user # 🔐 Importando o protetor do Firebase
from repositories.empresa_repository import EmpresaRepository

router = APIRouter(prefix="/api", tags=["Relatórios & BI"])

@router.get("/metricas")
def obter_metricas_dashboard(
    db: Session = Depends(get_db), 
    usuario_logado = Depends(get_current_user) # 🔐 Aqui o FastAPI extrai o técnico logado pelo token
):
    # Recupera o ID da empresa associado diretamente ao cadastro deste técnico
    empresa_id = usuario_logado.empresa_id 
    
    if not empresa_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Este usuário técnico não está vinculado a nenhuma empresa cadastrada."
        )
        
    repo = EmpresaRepository()
    dados = repo.obter_dados_bi(db, empresa_id=empresa_id)
    return dados