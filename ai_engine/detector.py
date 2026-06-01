from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .database import get_db
from . import models # Seus modelos baseados no SQL que você mandou

router = APIRouter()

@router.post("/registrar-infracao")
async def registrar_infracao(tipo: str, confianca: float, setor: str, db: Session = Depends(get_db)):
    nova_infracao = models.InfracaoEPI(
        tipo_epi=tipo,
        confianca_ia=confianca,
        setor=setor
    )
    db.add(nova_infracao)
    db.commit()
    return {"status": "sucesso", "id": nova_infracao.id}