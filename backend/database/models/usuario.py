#models
#usuario.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class PerfilAcesso(Base):
    __tablename__ = "perfis_acesso"

    id_perfil = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome_perfil = Column(String(50), unique=True, nullable=False)  # Ex: 'Administrador', 'Segurança'

    # Relacionamento reverso para a tabela de usuários
    usuarios = relationship("Usuario", back_populates="perfil")


class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    firebase_uid = Column(String(128), unique=True, nullable=False, index=True)  # Link com o Firebase Auth
    senha_hash = Column(String(255), nullable=True)  # Fica nulo pois a senha é gerenciada pelo Firebase
    status_usuario = Column(Boolean, default=True, nullable=False)
    
    # Chave Estrangeira obrigatória do Perfil de Acesso
    id_perfil = Column(Integer, ForeignKey("perfis_acesso.id_perfil"), nullable=False)
    
    # Relacionamento estruturado
    perfil = relationship("PerfilAcesso", back_populates="usuarios")