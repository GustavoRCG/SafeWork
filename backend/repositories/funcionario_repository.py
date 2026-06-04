from sqlalchemy.orm import Session
from database import models
from schemas.funcionario_schema import FuncionarioCreate

class FuncionarioRepository:
    def __init__(self, db: Session):
        self.db = db

    # Método para salvar o funcionário no banco
    def create(self, funcionario_data: FuncionarioCreate):
        db_funcionario = models.Funcionario(
            id_empresa=funcionario_data.id_empresa,
            nome=funcionario_data.nome,
            cpf=funcionario_data.cpf,
            cargo=funcionario_data.cargo,
            data_admissao=funcionario_data.data_admissao,
            face_encoding=None # Inicialmente começa sem FaceID (será cadastrado depois pela IA)
        )
        self.db.add(db_funcionario)
        self.db.commit()
        self.db.refresh(db_funcionario)
        return db_funcionario

    # Método para listar todos os funcionários de uma empresa específica
    def get_by_empresa(self, id_empresa: int):
        return self.db.query(models.Funcionario).filter(models.Funcionario.id_empresa == id_empresa).all()

    # Método para buscar um funcionário específico pelo CPF (útil para evitar duplicados)
    def get_by_cpf(self, cpf: str):
        return self.db.query(models.Funcionario).filter(models.Funcionario.cpf == cpf).first()