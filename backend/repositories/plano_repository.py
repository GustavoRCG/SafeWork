from sqlalchemy.orm import Session
from database import models
from schemas.plano_schema import PlanoCreate

class PlanoRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_nome(self, nome: str):
        return self.db.query(models.Plano).filter(models.Plano.nome == nome).first()

    def create(self, plano_data: PlanoCreate):
        db_plano = models.Plano(
            nome=plano_data.nome,
            descricao=plano_data.descricao,
            limite_cameras=plano_data.limite_cameras,
            preco=plano_data.preco
        )
        self.db.add(db_plano)
        self.db.commit()
        self.db.refresh(db_plano)
        return db_plano

    def get_all(self):
        return self.db.query(models.Plano).all()