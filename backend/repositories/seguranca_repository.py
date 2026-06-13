from sqlalchemy.orm import Session
from database.models.seguranca import DeteccaoModel, CameraModel, ConfigIAModel
from schemas.seguranca_schema import ConfigIARequest

class SegurancaRepository:
    
    @staticmethod
    def listar_alertas(db: Session):
        return db.query(DeteccaoModel, CameraModel).\
            join(CameraModel, DeteccaoModel.id_camera == CameraModel.id_camera).\
            order_by(DeteccaoModel.data_hora.desc()).all()

    @staticmethod
    def listar_cameras(db: Session):
        return db.query(CameraModel).all()

    @staticmethod
    def obter_config_ia(db: Session):
        return db.query(ConfigIAModel).first()

    @staticmethod
    def salvar_config_ia(db: Session, payload: ConfigIARequest):
        config = db.query(ConfigIAModel).first()
        if not config:
            config = ConfigIAModel()
            db.add(config)
            
        config.confianca_minima = payload.confianca_minima
        config.auditar_capacete = payload.regras.capacete
        config.auditar_colete = payload.regras.colete
        config.auditar_luvas = payload.regras.luvas
        config.alertar_zona_risco = payload.regras.zonaRisco
        
        db.commit()
        db.refresh(config)
        return config