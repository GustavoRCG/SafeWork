from sqlalchemy import Column, Integer, String, ForeignKey
from database.database import Base

class SetorModel(Base):
    __tablename__ = "setores"

    id_setor = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_empresa = Column(Integer, nullable=False) # Adicione ForeignKey se tiver a tabela empresas
    nome_setor = Column(String(50), nullable=False)
    nivel_risco = Column(String(20), nullable=False)