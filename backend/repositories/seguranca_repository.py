from sqlalchemy.orm import Session
from database.models.seguranca import DeteccaoModel, CameraModel, ConfigIAModel
from schemas.seguranca_schema import ConfigIARequest

class SegurancaRepository:
    
    @staticmethod
    def listar_alertas(db: Session, id_empresa: int):
        """
        Busca as detecções trazendo os modelos de Câmera associados.
        💡 AJUSTE: O campo 'id' agora adiciona o prefixo 'ALT-' e converte para string
        para satisfazer as regras de validação do Pydantic (AlertaResponse).
        """
        # 1. Realiza a consulta unindo as tabelas de Detecção e Câmera
        resultados = db.query(DeteccaoModel, CameraModel)\
                       .join(CameraModel, DeteccaoModel.id_camera == CameraModel.id_camera)\
                       .order_by(DeteccaoModel.id_deteccao.desc())\
                       .all()

        # 2. Formata e normaliza a lista de objetos para enviar ao Frontend React
        lista_formatada = []
        for deteccao, camera in resultados:
            # Garante uma string amigável para a data/hora
            if deteccao.data_hora:
                try:
                    dt_puro = deteccao.data_hora.replace(tzinfo=None)
                    timestamp_str = dt_puro.strftime("%d/%m/%Y %H:%M:%S")
                except Exception:
                    timestamp_str = "Erro na data"
            else:
                timestamp_str = "Sem Data"
            
            # Determina a classe de infração capturada pela IA
            classe_infracao = deteccao.tipo_falta_epi if hasattr(deteccao, 'tipo_falta_epi') and deteccao.tipo_falta_epi else "Não-Conformidade"
            
            alerta_dict = {
                "id": f"ALT-{deteccao.id_deteccao}",  # ✨ CORREÇÃO: Força o tipo string que o Pydantic exige
                "timestamp": timestamp_str,
                "camera": camera.nome_camera if camera.nome_camera else f"Câmera #{camera.id_camera}",
                "classe": classe_infracao,
                "criticidade": "Crítico" if float(deteccao.confianca_ia or 1) > 0.75 else "Moderado",
                "status": "Pendente"  # Status padrão exigido pelo dashboard
            }
            lista_formatada.append(alerta_dict)

        return lista_formatada

    @staticmethod
    def listar_cameras(db: Session, id_empresa: int):
        """
        Retorna a lista de todas as câmeras cadastradas.
        """
        return db.query(CameraModel).all()

    @staticmethod
    def obter_config_ia(db: Session):
        """
        Recupera as configurações de sensibilidade e regras da IA.
        """
        return db.query(ConfigIAModel).first()

    @staticmethod
    def salvar_config_ia(db: Session, payload: ConfigIARequest):
        """
        Atualiza ou cria os parâmetros operacionais da IA no banco de dados.
        """
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