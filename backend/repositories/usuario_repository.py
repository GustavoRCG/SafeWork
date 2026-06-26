#usuario_repository.py  

from sqlalchemy.orm import Session

# Ajuste nos imports para refletir o novo padrão de nomes dos arquivos (.py)
from database.models.usuario import Usuario,PerfilAcesso
import schemas.usuario_schema as schemas

class UsuarioRepository:
    @staticmethod
    def buscar_por_email(db: Session, email: str) -> Usuario:
        return db.query(Usuario).filter(Usuario.email == email).first()

    @staticmethod
    def buscar_por_id(db: Session, id_usuario: int) -> Usuario:
        return db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()

    @staticmethod
    def listar(db: Session, skip: int = 0, limit: int = 100):
        return db.query(Usuario).offset(skip).limit(limit).all()

    @staticmethod
    def salvando_no_banco(db: Session, usuario:Usuario):
            db.add(usuario)
            db.commit()
            db.refresh(usuario)
            return usuario

    @staticmethod
    def deletar_do_banco(db: Session, usuario_db:Usuario):
        db.delete(usuario_db)
        db.commit()


class PerfilRepository:
    @staticmethod
    def buscar_perfil_por_id(db: Session, id_perfil: int) -> PerfilAcesso:
        return db.query(PerfilAcesso).filter(PerfilAcesso.id_perfil == id_perfil).first()

    @staticmethod
    def listar_perfis(db: Session):
        return db.query(PerfilAcesso).all()