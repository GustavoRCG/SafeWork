class EmpresaController:
    def __init__(self, empresa_repository):
        # POO: Injeção de dependência do repositório
        self.empresa_repository = empresa_repository

    def cadastrar(self, empresa_in):
        # Regra de negócio: impede o cadastro de empresas com o mesmo CNPJ
        if self.empresa_repository.get_by_cnpj(empresa_in.cnpj):
            raise Exception("Já existe uma empresa cadastrada com este CNPJ.")
            
        try:
            return self.empresa_repository.create(empresa_in)
        except Exception as e:
            raise Exception(f"Erro ao processar criação da empresa: {str(e)}")

    def listar_todas(self):
        return self.empresa_repository.get_all()