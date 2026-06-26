from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from database.models.setores import SetorModel 
from schemas.setor_schema import SetorCreate, SetorUpdate, SetorResponse

router = APIRouter(prefix="/api/setores", tags=["Gerenciamento de Setores"])

# 1. CREATE (Criar)
@router.post("/", response_model=SetorResponse, status_code=status.HTTP_201_CREATED)
def criar_setor(setor_in: SetorCreate, db: Session = Depends(get_db)):
    # Converte o schema Pydantic em um modelo SQLAlchemy
    novo_setor = SetorModel(**setor_in.model_dump())
    
    db.add(novo_setor)
    db.commit()
    db.refresh(novo_setor)  
    return novo_setor


# 2. READ ALL (Listar todos)
@router.get("/", response_model=List[SetorResponse])
def listar_setores(db: Session = Depends(get_db)):
    return db.query(SetorModel).all()


# 3. READ ONE (Visualizar Detalhes por ID)
@router.get("/{id_setor}", response_model=SetorResponse)
def obter_setor(id_setor: int, db: Session = Depends(get_db)):
    setor = db.query(SetorModel).filter(SetorModel.id_setor == id_setor).first()
    if not setor:
        raise HTTPException(status_code=404, detail="Setor não encontrado")
    return setor


# 4. UPDATE (Atualizar)
@router.put("/{id_setor}", response_model=SetorResponse)
def atualizar_setor(id_setor: int, setor_in: SetorUpdate, db: Session = Depends(get_db)):
    setor_db = db.query(SetorModel).filter(SetorModel.id_setor == id_setor).first()
    if not setor_db:
        raise HTTPException(status_code=404, detail="Setor não encontrado")
    
    # Transforma os dados enviados em dicionário, ignorando campos não enviados (None)
    dados_atualizados = setor_in.model_dump(exclude_unset=True)
    
    for chave, valor in dados_atualizados.items():
        setattr(setor_db, chave, valor)
        
    db.commit()
    db.refresh(setor_db)
    return setor_db


# 5. DELETE (Excluir)
@router.delete("/{id_setor}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_setor(id_setor: int, db: Session = Depends(get_db)):
    setor_db = db.query(SetorModel).filter(SetorModel.id_setor == id_setor).first()
    if not setor_db:
        raise HTTPException(status_code=404, detail="Setor não encontrado")
    
    db.delete(setor_db)
    db.commit()
    return None  # Retornos 204 No Content não devem possuir corpo na resposta