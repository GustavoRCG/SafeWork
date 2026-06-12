import psycopg2
from psycopg2.extras import RealDictCursor

class FuncionarioController:
    def __init__(self, db_connection):
        # Recebe a conexão ativa com o banco PostgreSQL (Injeção de Dependência)
        self.db_connection = db_connection

    def get_by_cpf(self, cpf: str):
        """Busca um funcionário pelo CPF para a validação do Controller"""
        query = """
            SELECT id_funcionario, id_empresa, nome, cpf, cargo, face_encoding, data_admissao 
            FROM public.funcionarios 
            WHERE cpf = %s;
        """
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (cpf,))
                resultado = cursor.fetchone()
                return resultado # Retorna o dicionário ou None se não achar
        except Exception as e:
            raise Exception(f"Erro ao consultar CPF no PostgreSQL: {str(e)}")

    def create(self, funcionario_in):
        """Insere o colaborador persistindo o Base64 no campo face_encoding TEXT"""
        query = """
            INSERT INTO public.funcionarios (
                id_empresa, nome, cpf, cargo, face_encoding, data_admissao
            ) VALUES (%s, %s, %s, %s, %s, CURRENT_DATE)
            RETURNING id_funcionario;
        """
        
        valores = (
            funcionario_in.id_empresa,
            funcionario_in.nome,
            funcionario_in.cpf,
            funcionario_in.cargo,
            funcionario_in.face_id_image # Pega a string Base64 da foto enviada pelo React
        )
        
        try:
            with self.db_connection.cursor() as cursor:
                cursor.execute(query, valores)
                # Captura o id_funcionario gerado pelo SERIAL PRIMARY KEY
                id_gerado = cursor.fetchone()[0]
                self.db_connection.commit() # Efetiva a transação no banco
                
                # Retorna um dicionário que o FastAPI consiga serializar na resposta
                return {
                    "id_funcionario": id_gerado,
                    "id_empresa": funcionario_in.id_empresa,
                    "nome": funcionario_in.nome,
                    "cpf": funcionario_in.cpf,
                    "cargo": funcionario_in.cargo,
                    "face_encoding": funcionario_in.face_id_image,
                    "data_admissao": funcionario_in.data_admissao
                }
        except Exception as e:
            self.db_connection.rollback() # Cancela a transação em caso de falha
            raise Exception(f"Falha na execução do INSERT no PostgreSQL: {str(e)}")

    def get_by_empresa(self, id_empresa: int):
        """Lista todos os funcionários de uma empresa específica para o painel do RH"""
        query = """
            SELECT id_funcionario, nome, cpf, cargo, data_admissao 
            FROM public.funcionarios 
            WHERE id_empresa = %s 
            ORDER BY nome ASC;
        """
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (id_empresa,))
                return cursor.fetchall() # Retorna a lista de funcionários
        except Exception as e:
            raise Exception(f"Erro ao listar funcionários por empresa: {str(e)}")

    def cadastrar(self, funcionario_in):
        """Atalho chamado pelo arquivo de rotas"""
        return self.create(funcionario_in)
        
    def listar_por_empresa(self, id_empresa: int):
        """Atalho chamado pelo arquivo de rotas"""
        return self.get_by_empresa(id_empresa)