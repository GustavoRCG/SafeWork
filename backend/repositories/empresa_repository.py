import os  
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from sqlalchemy.orm import Session
from database import models
from firebase_admin import auth 
from fastapi import BackgroundTasks


class EmpresaRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_cnpj(self, cnpj: str):
        return self.db.query(models.Empresa).filter(models.Empresa.cnpj == cnpj).first()

    def get_by_id(self, empresa_id: int):
        return self.db.query(models.Empresa).filter(models.Empresa.id_empresa == empresa_id).first()

    def get_all(self):
        return self.db.query(models.Empresa).all()

    def create_empresa(self, dados_completos,background_tasks=None):
        """
        Método unificado acionado pelo Controller na última fase do Onboarding.
        Guarda tudo no Firebase e no Banco em uma única transação atômica.
        """
        # Extrai dicionário independente de ser Pydantic v1 ou v2
        if hasattr(dados_completos, "model_dump"):
            dados = dados_completos.model_dump()
        elif hasattr(dados_completos, "dict"):
            dados = dados_completos.dict()
        else:
            dados = dados_completos

        firebase_user = None
        try:
            # --- FASE 1: DADOS CADASTRAIS ---
            cnpj = dados.get("cnpj")
            razao_social = dados.get("razao_social")
            senha_master = dados.get("senhaempresa") or dados.get("senha")
            email_contato = dados.get("email_contato")

            if not email_contato:
                raise Exception("O e-mail de contato é obrigatório para o onboarding.")

            if self.get_by_cnpj(cnpj):
                raise Exception("Este CNPJ já está cadastrado no sistema.")

            email_cadastro = f"admin_{cnpj}@safework.com"

            # 1. Criação no Firebase Auth
            firebase_user = auth.create_user(
                email=email_cadastro,
                password=senha_master,
                display_name=razao_social
            )

            # --- FASE 2: PLANO SELECIONADO ---
            id_plano = dados.get("id_plano") or dados.get("idPlano") or 1

            # 2. Instancia a empresa com o status ativo
            db_empresa = models.Empresa(
                razao_social=razao_social,
                cnpj=cnpj,
                senhaempresa=firebase_user.uid,  
                status_assinatura="ativo",      
                id_plano=int(id_plano)
            )
            
            self.db.add(db_empresa)
            self.db.flush()  # Captura o id_empresa gerado pelo serial do Postgres

            # --- FASE 3: MÉTODO DE PAGAMENTO HÍBRIDO (CARTÃO OU DÉBITO EM CONTA) ---
            tipo_metodo = str(dados.get("tipo_metodo") or dados.get("tipoMetodo") or "CARTAO").upper()[:20]
            titular_nome = str(dados.get("titular_nome") or dados.get("titularNome") or "TITULAR").upper()[:100]

            novo_metodo = models.MetodoPagamento(
                id_empresa=db_empresa.id_empresa,
                tipo_metodo=tipo_metodo,
                titular_nome=titular_nome,
                token_pagamento=dados.get("token_pagamento", "TOKEN_PROVISORIO_API")[:20],
                padrao=True
            )

            # Define as propriedades com base na escolha de pagamento
            if "CONTA" in tipo_metodo or "DEBITO" in tipo_metodo:
                novo_metodo.tipo_metodo = "DEBITO_CONTA"
                novo_metodo.banco_codigo = str(dados.get("banco_codigo") or dados.get("bancoCodigo") or "341")[:10]
                novo_metodo.agencia = str(dados.get("agencia") or "0001")[:10]
                conta_corrente_limpa = str(dados.get("conta_corrente") or dados.get("contaCorrente") or "00000-0").strip()
                # Fallback de texto descritivo simples caso necessite ler no padrão antigo
                novo_metodo.numero_mascarado = conta_corrente_limpa[:20]
                novo_metodo.numero_mascarado = f"{novo_metodo.agencia}/{novo_metodo.conta_corrente}"[:20]
            else:
                novo_metodo.tipo_metodo = "CARTAO"
                novo_metodo.numero_mascarado = str(dados.get("numero_mascarado") or dados.get("numeroMascarado") or "XXXX-XXXX-XXXX-0000")[:20]
                novo_metodo.data_expiracao = str(dados.get("data_expiracao") or dados.get("dataExpiracao") or "12/2030")[:10]

            self.db.add(novo_metodo)
            
            # Consolida o banco se todas as etapas passaram sem falhas
            self.db.commit()
            self.db.refresh(db_empresa)
            
            # --- FASE 4: DISPARO DE BOAS-VINDAS ---
            self.enviar_email_boas_vindas(
                email_destino=email_contato,
                razao_social=razao_social,
                email_admin=email_cadastro,
                plano_id=id_plano,
                tipo_pagamento=novo_metodo.tipo_metodo
            )
            return db_empresa

        except Exception as e:
            # Fallback de segurança: remove o usuário no Firebase se a transação do banco falhar
            if firebase_user and firebase_user.uid:
                try:
                    auth.delete_user(firebase_user.uid)
                except Exception:
                    pass
                
            self.db.rollback()
            raise Exception(str(e))

    def update_plano_e_pagamento(self, empresa_id: int, dados_pagamento):
        """
        Atualiza o plano e insere o método de pagamento caso a empresa separe o fluxo.
        """
        if hasattr(dados_pagamento, "model_dump"):
            dados = dados_pagamento.model_dump()
        else:
            dados = dados_pagamento.dict() if hasattr(dados_pagamento, "dict") else dados_pagamento

        try:
            empresa = self.get_by_id(empresa_id)
            if not empresa:
                raise Exception("Empresa não encontrada.")

            id_plano = dados.get("id_plano") or dados.get("idPlano")
            empresa.id_plano = id_plano
            empresa.status_assinatura = "ativo"

            tipo_metodo = str(dados.get("tipo_metodo") or dados.get("tipoMetodo") or "CARTAO").upper()
            titular_nome = str(dados.get("titular_nome") or dados.get("titularNome") or "TITULAR").upper()

            novo_metodo = models.MetodoPagamento(
                id_empresa=empresa.id_empresa,
                titular_nome=titular_nome,
                token_pagamento=dados.get("token_pagamento", "TOKEN_PROVISORIO_API"),
                padrao=True
            )

            if "CONTA" in tipo_metodo or "DEBITO" in tipo_metodo:
                novo_metodo.tipo_metodo = "DEBITO_CONTA"
                novo_metodo.banco_codigo = str(dados.get("banco_codigo") or dados.get("bancoCodigo") or "341")[:10]
                novo_metodo.agencia = str(dados.get("agencia") or "0001")[:10]
                
                # Captura a conta corrente do formulário
                conta_crua = str(dados.get("conta_corrente") or dados.get("contaCorrente") or "00000-0")
                novo_metodo.conta_corrente = conta_crua[:20] # Força o limite máximo do campo no BD
                
                # Trunca o número mascarado de forma segura para não passar de 20 caracteres
                novo_metodo.numero_mascarado = f"{novo_metodo.agencia}/{novo_metodo.conta_corrente}"[:20]
            else:
                novo_metodo.tipo_metodo = "CARTAO"
                novo_metodo.numero_mascarado = dados.get("numero_mascarado") or dados.get("numeroMascarado") or "XXXX-XXXX-XXXX-0000"
                novo_metodo.data_expiracao = dados.get("data_expiracao") or dados.get("dataExpiracao") or "12/2030"

            self.db.add(novo_metodo)
            self.db.commit()
            self.db.refresh(empresa)
            return empresa
        except Exception as e:
            self.db.rollback()
            raise Exception(str(e))

    def enviar_email_boas_vindas(self, email_destino, razao_social, email_admin, plano_id, tipo_pagamento="CARTAO"):
            """
            Envia o e-mail real utilizando SMTP autenticado com design em HTML.
            """
            # Carrega configurações do .env com fallbacks de segurança
            smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
            smtp_port = int(os.getenv("SMTP_PORT", 587))
            smtp_user = os.getenv("SMTP_USER", "")
            smtp_password = os.getenv("SMTP_PASSWORD", "")

            if not smtp_user or not smtp_password:
                print("ERRO: Credenciais SMTP não configuradas no ambiente (.env). O email não foi enviado.")
                return

            assunto = f"Ambiente Ativado - Bem-vindo à SafeWork, {razao_social}!"
            forma_pagamento_texto = "Cartão de Crédito" if tipo_pagamento == "CARTAO" else "Débito Automático em Conta"
            nome_plano = "SafeWork Pro" if int(plano_id) == 1 else "SafeWork Advanced"

            # Criação do container MIME
            msg = MIMEMultipart("alternative")
            msg["Subject"] = assunto
            msg["From"] = f"SafeWork AI <{smtp_user}>"
            msg["To"] = email_destino

            # Template HTML moderno para agregar valor ao produto
            html_corpo = f"""
            <html>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
                    <div style="background: #0f172a; padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">SAFE<span style="color: #dc2626;">WORK</span> AI</h1>
                        <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 14px;">Visão Computacional Aplicada à Segurança</p>
                    </div>
                    <div style="padding: 30px; line-height: 1.6;">
                        <p style="font-size: 18px; font-weight: bold; margin-top: 0;">Olá, {razao_social}!</p>
                        <p>Sua contratação foi processada com sucesso. Seu módulo de monitoramento inteligente de EPIs e Perímetro já está ativo e operacional.</p>
                        
                        <div style="background: #f1f5f9; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                            <h4 style="margin: 0 0 10px 0; color: #0f172a;">📊 DETALHES DO SEU PLANO</h4>
                            <p style="margin: 4px 0; font-size: 14px;"><b>Plano:</b> {nome_plano}</p>
                            <p style="margin: 4px 0; font-size: 14px;"><b>Método de Cobrança:</b> {forma_pagamento_texto}</p>
                            <p style="margin: 4px 0; font-size: 14px;"><b>Status do Pagamento:</b> <span style="color: #16a34a; font-weight: bold;">AUTORIZADO ✅</span></p>
                        </div>

                        <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">🔑 CREDENCIAIS DO PAINEL MASTER</h3>
                        <p>Use os dados abaixo para acessar o painel administrativo da empresa:</p>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; width: 120px;"><b>Link de Acesso:</b></td>
                                <td style="padding: 8px 0;"><code>http://seu-sistema.safework.com/login</code></td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;"><b>E-mail de Login:</b></td>
                                <td style="padding: 8px 0; font-weight: bold; color: #dc2626;">{email_admin}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;"><b>Senha:</b></td>
                                <td style="padding: 8px 0; color: #334155;"><i>A senha Master definida no formulário.</i></td>
                            </tr>
                        </table>

                        <div style="text-align: center; margin-top: 30px;">
                            <a href="http://localhost:3000/login" style="background: #dc2626; color: #ffffff; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block; box-shadow: 0 2px 4px rgba(220,38,38,0.2);">Acessar Painel de Controle</a>
                        </div>
                    </div>
                    <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
                        Este é um e-mail automático enviado pelo Onboarding SafeWork AI.<br>
                        Suporte Técnico: <b>suporte@safework.com</b>
                    </div>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(html_corpo, "html"))

            # Bloco SMTP para envio seguro usando TLS
            try:
                server = smtplib.SMTP(smtp_server, smtp_port)
                server.starttls() # Inicializa a criptografia TLS requerida pela maioria dos servidores modernos
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_user, email_destino, msg.as_string())
                server.quit()
                print(f"E-MAIL ENVIADO COM SUCESSO PARA: {email_destino}")
            except Exception as error:
                print(f"ERRO CRÍTICO AO DISPARAR EMAIL SMTP: {str(error)}")