from schemas.empresa_schema import EmpresaCreate, EmpresaPagamentoUpdate

class EmpresaController:
    def __init__(self, empresa_repository):
        """
        POO: Injeção de dependência do repositório de empresas.
        """
        self.empresa_repository = empresa_repository

    def cadastrar(self, empresa_in: EmpresaCreate, background_tasks=None):
        """
        Regra de negócio unificada: Encaminha o payload completo (Dados + Plano + Método Híbrido)
        para o repositório fazer a criação atômica.
        """
        try:
            return self.empresa_repository.create_empresa(empresa_in, background_tasks)
        except Exception as e:
            raise Exception(f"Erro ao processar criação da empresa: {str(e)}")

    def vincular_plano_e_pagamento(self, empresa_id: int, dados_pagamento: EmpresaPagamentoUpdate):
        """
        Fluxo Alternativo/Recorrência: 
        Atualiza o plano escolhido e vincula um novo método (Cartão ou Conta Bancária).
        """
        empresa = self.empresa_repository.get_by_id(empresa_id)
        if not empresa:
            raise Exception("Empresa não encontrada.")

        try:
            return self.empresa_repository.update_plano_e_pagamento(
                empresa_id=empresa_id,
                dados_pagamento=dados_pagamento
            )
        except Exception as e:
            raise Exception(f"Erro ao vincular plano e método de pagamento: {str(e)}")

    def listar_todas(self):
        """
        Retorna a listagem de todas as empresas cadastradas no sistema (Área Administrativa).
        """
        return self.empresa_repository.get_all()

    # 🚀 ADICIONE ESTE MÉTODO ABAIXO PARA O SEU TCC:
    def obter_metricas(self, empresa_id: int):
        """
        Camada de Controle: Aciona o repositório para buscar as estatísticas da empresa 
        especificada, aplicando a regra de isolamento de dados do SafeWork.
        """
        try:
            # Delega a busca filtrada e segura diretamente para o repository
            return self.empresa_repository.obter_metricas(empresa_id)
        except Exception as e:
            raise Exception(f"Erro no controller ao buscar métricas: {str(e)}")