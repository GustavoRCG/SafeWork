#camera_repository.py

from sqlalchemy.orm import Session
from database.models.camera_model import CameraModel  
import schemas.camera_schema as schemas

class CameraRepository:

    @staticmethod
    def salvar(db: Session, camera: CameraModel) -> CameraModel:
        """Adiciona e confirma uma instância de câmera no banco de dados"""
        db.add(camera)
        db.commit()
        db.refresh(camera)
        return camera

    @staticmethod
    def listar_todas(db: Session, skip: int = 0, limit: int = 100):
        """Retorna a lista completa de câmeras com paginação"""
        return db.query(CameraModel).offset(skip).limit(limit).all()

    @staticmethod
    def buscar_por_id(db: Session, id_camera: int) -> CameraModel:
        """Busca uma única câmera pela chave primária (id_camera)"""
        return db.query(CameraModel).filter(CameraModel.id_camera == id_camera).first()

    @staticmethod
    def atualizar(db: Session) -> None:
        """Executa o commit das alterações pendentes no banco de dados"""
        db.commit()

    @staticmethod
    def deletar(db: Session, camera: CameraModel) -> None:
        """Remove uma câmera do banco de dados"""
        db.delete(camera)
        db.commit()