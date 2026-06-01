from sqlalchemy import Column, Integer, String, ForeignKey, Text, Date
from ..database import Base

class Funcionario(Base):
    __tablename__ = "funcionarios"
    __table_args__ = {"schema": "public"}

    id_funcionario = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_empresa = Column(Integer, ForeignKey("public.empresas.id_empresa", ondelete="CASCADE"), nullable=False)
    nome = Column(String(100), nullable=False)
    cpf = Column(String(14), unique=True, nullable=False)
    cargo = Column(String(50), nullable=True)
    face_encoding = Column(Text, nullable=True) # Aqui a IA de reconhecimento facial vai salvar as matrizes numéricas!
    data_admissao = Column(Date, nullable=True)