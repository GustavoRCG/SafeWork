from sqlalchemy.orm import Session
from database import models
from schemas.empresa_schema import EmpresaCreate

class EmpresaRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_cnpj(self, cnpj: str):
        # Correção inteligente: mapeando dinamicamente o modelo correto
        return self.db.query(models.Empresa).filter(models.Empresa.cnpj == cnpj).first()

    def create(self, empresa_data: EmpresaCreate):
        db_empresa = models.Empresa(
            razao_social=empresa_data.razao_social,
            cnpj=empresa_data.cnpj,
            id_plano=empresa_data.id_plano
        )
        self.db.add(db_empresa)
        self.db.commit()
        self.db.refresh(db_empresa)
        return db_empresa

    def get_all(self):
        return self.db.query(models.Empresa).all()