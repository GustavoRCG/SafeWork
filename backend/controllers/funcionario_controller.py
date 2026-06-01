from fastapi import HTTPException, status

class FuncionarioController:
    def __init__(self, funcionario_repository):
        # POO: Injeção de dependência do repositório
        self.funcionario_repository = funcionario_repository

    def cadastrar(self, funcionario_in):
        # Regra de Negócio: Impede cadastrar dois funcionários com o mesmo CPF
        if self.funcionario_repository.get_by_cpf(funcionario_in.cpf):
            raise Exception("Já existe um funcionário cadastrado com este CPF.")
            
        try:
            return self.funcionario_repository.create(funcionario_in)
        except Exception as e:
            raise Exception(f"Erro interno ao salvar funcionário: {str(e)}")

    def listar_por_empresa(self, id_empresa: int):
        return self.funcionario_repository.get_by_empresa(id_empresa)