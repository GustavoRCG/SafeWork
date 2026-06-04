from sqlalchemy.orm import Session
from database import models

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    # ATENÇÃO AQUI: A função PRECISA receber o 'firebase_uid' como segundo argumento!
    def create_user(self, user_data, firebase_uid: str):
        # Mapeamento manual com base estrita nas colunas da tabela public.usuarios
        db_user = models.Usuario(
            firebase_uid=firebase_uid,          # Recebe o parâmetro que veio do service
            id_empresa=user_data.id_empresa,    # integer
            id_perfil=user_data.id_perfil,      # integer
            email=user_data.email,              # varchar(100)
            id_funcionario=None                 # Começa nulo conforme seu banco
        )
        
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user