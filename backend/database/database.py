from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os

# 1. String de conexão com o banco de dados
# ⚠️ Lembrete: Garanta que a porta (ex: 3000, 5432) seja a mesma que deu "200 OK" nos seus testes!
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:123456@127.0.0.1:3000/Safework"

# 2. O engine (o motor que conversa com o driver psycopg2)
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 3. A fábrica de sessões (cada request terá sua própria conexão)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Nova forma de declarar o Base (Padrão SQLAlchemy 2.0+)
class Base(DeclarativeBase):
    pass

# 5. Dependência que será injetada nos Controllers / Rotas
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 6. Centralizando a segurança do Firebase aqui
# Isso permite fazer: from ..database import get_current_user nas suas rotas
from .firebase_config import get_current_user