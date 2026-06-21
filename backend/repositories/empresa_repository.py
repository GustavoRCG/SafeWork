from sqlalchemy.orm import Session
from database import models
from schemas.empresa_schema import EmpresaCreate
from firebase_admin import auth  

class EmpresaRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_cnpj(self, cnpj: str):
        return self.db.query(models.Empresa).filter(models.Empresa.cnpj == cnpj).first()

    def get_by_id(self, empresa_id: int):
        return self.db.query(models.Empresa).filter(models.Empresa.id_empresa == empresa_id).first()

    def create(self, empresa_data: EmpresaCreate):
        firebase_user = None
        try:
            # 1. Criação do usuário no Firebase Auth usando as credenciais válidas
            email_cadastro = f"admin_{empresa_data.cnpj}@safework.com"

            firebase_user = auth.create_user(
                email=email_cadastro,
                password=empresa_data.senhaempresa,
                display_name=empresa_data.razao_social
            )

            # 2. Persistência dos metadados locais no banco relacional
            db_empresa = models.Empresa(
                razao_social=empresa_data.razao_social,
                cnpj=empresa_data.cnpj,
                senhaempresa=firebase_user.uid,  
                status_assinatura="pendente",
                id_plano=None
            )
            
            self.db.add(db_empresa)
            self.db.commit()
            self.db.refresh(db_empresa)
            return db_empresa

        except Exception as e:
            # Caso ocorra um erro de integridade no banco de dados local, removemos o usuário criado no Firebase
            if firebase_user and firebase_user.uid:
                auth.delete_user(firebase_user.uid)
                
            self.db.rollback()
            raise Exception(f"Falha no Onboarding (Firebase/Banco): {str(e)}")

    def create_empresa(self, empresa_data: EmpresaCreate):
        return self.create(empresa_data)

    def update_plano_e_pagamento(self, empresa_id: int, id_plano: int, tipo_metodo: str, titular_nome: str, numero_mascarado: str):
        try:
            empresa = self.get_by_id(empresa_id)
            if not empresa:
                raise Exception("Empresa não encontrada")
            
            empresa.id_plano = id_plano
            empresa.status_assinatura = "ativo"

            novo_metodo = models.MetodoPagamento(
                id_empresa=empresa_id,
                tipo_metodo=tipo_metodo,
                titular_nome=titular_nome,
                numero_mascarado=numero_mascarado,
                token_pagamento="TOKEN_PROVISORIO",
                padrao=True
            )
            self.db.add(novo_metodo)
            
            self.db.commit()
            self.db.refresh(empresa)
            return empresa

        except Exception as e:
            self.db.rollback()
            raise Exception(f"Erro ao salvar dados no banco de dados: {str(e)}")

    def get_all(self):
        return self.db.query(models.Empresa).all()