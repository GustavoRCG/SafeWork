from sqlalchemy.orm import Session
from database import models
from schemas.funcionario_schema import FuncionarioCreate

class FuncionarioRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, funcionario_data: FuncionarioCreate):
        db_funcionario = models.Funcionario(
            id_empresa=funcionario_data.id_empresa,
            nome=funcionario_data.nome,
            cpf=funcionario_data.cpf,
            cargo=funcionario_data.cargo,
            data_admissao=funcionario_data.data_admissao,
            face_encoding=funcionario_data.face_id_image 
        )
        self.db.add(db_funcionario)
        self.db.commit()
        self.db.refresh(db_funcionario)
        return db_funcionario


    def cadastrar(self, funcionario_data: FuncionarioCreate):
        return self.create(funcionario_data)

    def get_by_empresa(self, id_empresa: int):
        return self.db.query(models.Funcionario).filter(models.Funcionario.id_empresa == id_empresa).all()

    def listar_por_empresa(self, id_empresa: int):
        return self.get_by_empresa(id_empresa)

    def get_by_cpf(self, cpf: str):
        return self.db.query(models.Funcionario).filter(models.Funcionario.cpf == cpf).first()