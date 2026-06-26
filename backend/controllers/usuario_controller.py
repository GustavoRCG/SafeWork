#usuario_controller.py

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from firebase_admin import auth as firebase_auth

from repositories.usuario_repository import UsuarioRepository, PerfilRepository
import database.models.usuario as models
import schemas.usuario_schema as schemas

class UsuarioController:
    @staticmethod
    def criar_novo_usuario(db: Session, usuario_in: schemas.UsuarioCreate):
        # 1. Valida se o email já existe no Postgres
        if UsuarioRepository.buscar_por_email(db, usuario_in.email):
            raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado no SafeWork.")
        
        # 2. Valida se o Perfil de acesso existe
        if not PerfilRepository.buscar_perfil_por_id(db, usuario_in.id_perfil):
            raise HTTPException(status_code=404, detail="Perfil de permissão informado não existe.")

        # 3. Registra no Firebase Authentication
        user_firebase = None
        try:
            user_firebase = firebase_auth.create_user(
                email=usuario_in.email,
                password=usuario_in.senha_hash,
                disabled=not usuario_in.status_usuario
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Erro no Firebase Auth: {str(e)}")

        # 4. Tenta salvar no PostgreSQL vinculando o UID recebido do Firebase
        try:
            novo_usuario = models.Usuario(
                email=usuario_in.email,
                firebase_uid=user_firebase.uid,
                senha_hash=None, # Centralizado no Firebase Auth por segurança
                id_perfil=usuario_in.id_perfil,
                status_usuario=usuario_in.status_usuario
            )
            # Executa a persistência através do método estático mapeado no Repositório
            return UsuarioRepository.salvando_no_banco(db, novo_usuario)
            
        except Exception as e:
            db.rollback()
            if user_firebase:
                firebase_auth.delete_user(user_firebase.uid)  # Rollback estratégico do Firebase Auth
            raise HTTPException(
                status_code=500, 
                detail=f"Erro ao persistir no Postgres. Operação revertida: {str(e)}"
            )

    @staticmethod
    def listar_todos(db: Session, skip: int, limit: int):
        return UsuarioRepository.listar(db, skip, limit)

    @staticmethod
    def buscar_por_id(db: Session, id_usuario: int):
        usuario = UsuarioRepository.buscar_por_id(db, id_usuario)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não localizado.")
        return usuario

    @staticmethod
    def atualizar_dados(db: Session, id_usuario: int, campos_update: schemas.UsuarioUpdate):
        usuario = UsuarioRepository.buscar_por_id(db, id_usuario)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

        if campos_update.id_perfil is not None:
            if not PerfilRepository.buscar_perfil_por_id(db, campos_update.id_perfil):
                raise HTTPException(status_code=404, detail="Perfil informado inválido.")
            usuario.id_perfil = campos_update.id_perfil

        if campos_update.status_usuario is not None:
            if usuario.status_usuario != campos_update.status_usuario:
                try:
                    firebase_auth.update_user(usuario.firebase_uid, disabled=not campos_update.status_usuario)
                    usuario.status_usuario = campos_update.status_usuario
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Falha de sincronia com Firebase: {str(e)}")

        db.commit()
        db.refresh(usuario)
        return usuario

    @staticmethod
    def excluir_usuario(db: Session, id_usuario: int):
        usuario = UsuarioRepository.buscar_por_id(db, id_usuario)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário inexistente.")

        try:
            firebase_auth.delete_user(usuario.firebase_uid)
        except Exception:
            print(f"Usuário {usuario.email} já removido do Firebase ou não localizado.")

        UsuarioRepository.deletar_do_banco(db, usuario)
        return {"success": True, "message": "Usuário completamente excluído."}
    
    @staticmethod
    def listar_perfis_acesso(db: Session):
        return PerfilRepository.listar_perfis(db)