from firebase_admin import auth as firebase_auth

class AuthController:
    def __init__(self, user_repository):
        # POO: Recebe o repositório por injeção de dependência
        self.user_repository = user_repository

    def create_user(self, user_data):
        user_firebase = None
        try:
            # 1. Criar usuário no Firebase
            user_firebase = firebase_auth.create_user(
                email=user_data.email,
                password=user_data.password,
                display_name=user_data.nome
            )

            # 2. Salvar no PostgreSQL usando o repositório
            db_user = self.user_repository.create_user(user_data, user_firebase.uid)

            return {
                "message": "Usuário registrado com sucesso!",
                "uid": user_firebase.uid,
                "id_local": db_user.id_usuario
            }

        except Exception as e:
            # Se falhar no banco, deleta do Firebase (Rollback)
            if user_firebase:
                print(f"Erro no banco. Desfazendo no Firebase para o UID: {user_firebase.uid}")
                firebase_auth.delete_user(user_firebase.uid)
            raise Exception(str(e))