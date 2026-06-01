class PlanoController:
    def __init__(self, plano_repository):
        # POO: Injeção de dependência do repositório
        self.plano_repository = plano_repository

    def cadastrar(self, plano_in):
        # Regra de negócio: impede planos com nomes duplicados
        if self.plano_repository.get_by_nome(plano_in.nome):
            raise Exception("Já existe um plano cadastrado com este nome.")
            
        try:
            return self.plano_repository.create(plano_in)
        except Exception as e:
            raise Exception(f"Erro ao processar criação do plano: {str(e)}")

    def listar_todos(self):
        return self.plano_repository.get_all()