from schemas.empresa_schema import EmpresaCreate, EmpresaPagamentoUpdate

class EmpresaController:
    def __init__(self, empresa_repository):
        """
        POO: Injeção de dependência do repositório de empresas.
        """
        self.empresa_repository = empresa_repository

    def cadastrar(self, empresa_in: EmpresaCreate):
        """
        Regra de negócio: impede o cadastro de empresas com o mesmo CNPJ.
        Salva o primeiro passo do Onboarding (dados básicos).
        """
        if self.empresa_repository.get_by_cnpj(empresa_in.cnpj):
            raise Exception("Já existe uma empresa cadastrada com este CNPJ.")
            
        try:
            # Encaminha o Schema recebido para o repositório fazer o insert
            return self.empresa_repository.create_empresa(empresa_in)
        except Exception as e:
            raise Exception(f"Erro ao processar criação da empresa: {str(e)}")

    def vincular_plano_e_pagamento(self, empresa_id: int, dados_pagamento: EmpresaPagamentoUpdate):
        """
        Passo 2 e 3 do Onboarding:
        Atualiza o plano escolhido e confirma os dados do pagamento da empresa.
        """
        # 1. Regra de Negócio: Verifica se a empresa realmente existe antes de prosseguir
        empresa = self.empresa_repository.get_by_id(empresa_id)
        if not empresa:
            raise Exception("Empresa não encontrada.")
            
        # 2. (Opcional) Regra de Negócio: Evita re-vincular se já estiver ativa
        if empresa.status_assinatura == "ativo":
            raise Exception("Esta empresa já concluiu o onboarding e possui um plano ativo.")

        try:
            # Encaminha para o repositório salvar as alterações nas tabelas 'empresas' e 'metodos_pagamento'
            return self.empresa_repository.update_plano_e_pagamento(
                empresa_id=empresa_id,
                id_plano=dados_pagamento.id_plano,
                tipo_metodo=dados_pagamento.tipo_metodo,
                titular_nome=dados_pagamento.titular_nome,
                numero_mascarado=dados_pagamento.numero_mascarado
            )
        except Exception as e:
            raise Exception(f"Erro ao vincular plano e método de pagamento: {str(e)}")

    def listar_todas(self):
        """
        Retorna a listagem de todas as empresas cadastradas no sistema (Área Administrativa).
        """
        return self.empresa_repository.get_all()