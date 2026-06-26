#usuario_router.py

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db

import schemas.usuario_schema as schemas
from controllers.usuario_controller import UsuarioController

router = APIRouter(prefix="/api/usuarios", tags=["IAM - Gerenciamento de Usuários"])

@router.post("/", response_model=schemas.UsuarioResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    return UsuarioController.criar_novo_usuario(db, usuario)

@router.get("/", response_model=List[schemas.UsuarioResponse])
def listar_usuarios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return UsuarioController.listar_todos(db, skip, limit)

@router.get("/perfis-acesso", response_model=List[schemas.PerfilResponse])
def listar_perfis_para_formulario(db: Session = Depends(get_db)):
    """Rota usada pelo Front-end (React) para alimentar o campo <select> de cadastro"""
    return UsuarioController.listar_perfis_acesso(db)

@router.get("/{id_usuario}", response_model=schemas.UsuarioResponse)
def obter_usuario(id_usuario: int, db: Session = Depends(get_db)):
    return UsuarioController.buscar_por_id(db, id_usuario)

@router.put("/{id_usuario}", response_model=schemas.UsuarioResponse)
def atualizar_usuario(id_usuario: int, usuario_update: schemas.UsuarioUpdate, db: Session = Depends(get_db)):
    return UsuarioController.atualizar_dados(db, id_usuario, usuario_update)

@router.delete("/{id_usuario}")
def deletar_usuario(id_usuario: int, db: Session = Depends(get_db)):
    return UsuarioController.excluir_usuario(db, id_usuario)