from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db, get_current_user
from repositories.empresa_repository import EmpresaRepository
from controllers.empresa_controller import EmpresaController
from schemas.empresa_schema import EmpresaCreate, EmpresaResponse, EmpresaPagamentoUpdate 

router = APIRouter(prefix="/empresas", tags=["Empresas"], redirect_slashes=False)


@router.post("", response_model=EmpresaResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=EmpresaResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def criar_empresa(
    empresa_in: EmpresaCreate, 
    db: Session = Depends(get_db)
):
    """
    Passo 1 do Onboarding: Cria a conta master da empresa de forma pública.
    Afastando problemas de trailing slashes (aceita com ou sem barra).
    """
    repo = EmpresaRepository(db)
    controller = EmpresaController(repo)
    
    if repo.get_by_cnpj(empresa_in.cnpj):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Este CNPJ já está cadastrado no sistema."
        )
        
    try:
        return controller.cadastrar(empresa_in)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/{empresa_id}/vincular-pagamento", response_model=EmpresaResponse)
def vincular_plano_e_pagamento(
    empresa_id: int,
    dados_pagamento: EmpresaPagamentoUpdate,
    db: Session = Depends(get_db)
):
    """
    Passo 2 e 3 do Onboarding: Vincula o plano e salva a forma de pagamento.
    """
    repo = EmpresaRepository(db)
    controller = EmpresaController(repo)
    try:
        return controller.vincular_plano_e_pagamento(
            empresa_id=empresa_id,
            dados_pagamento=dados_pagamento
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/{empresa_id}/metricas", response_model=dict) # Altere o response_model para o seu schema de métricas se houver
def obter_metricas_empresa(
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Retorna as métricas e dados estatísticos de uma empresa específica.
    """
    repo = EmpresaRepository(db)
    controller = EmpresaController(repo)
    
    # Supondo que você crie esse método no seu controller posteriormente:
    metricas = controller.obter_metricas(empresa_id)
    if not metricas:
        raise HTTPException(status_code=404, detail="Métricas não encontradas para esta empresa.")
    return metricas