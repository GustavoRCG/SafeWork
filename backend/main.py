import os
import logging
import firebase_admin
from firebase_admin import credentials
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# Importação das suas rotas modulares
from routes import auth_routes, funcionario_routes, empresa_routes, plano_routes, seguranca_routes, relatorios_routes

# =========================================================================
# 📝 CONFIGURAÇÃO DE LOGS PARA EXIBIÇÃO NO TERMINAL
# =========================================================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SafeWork-Main")

# 1. Carregar variáveis de ambiente do arquivo .env
load_dotenv()

# 2. Configuração e Inicialização do Firebase Admin SDK
CHAVE_NAME = os.getenv("FIREBASE_KEY_PATH", "safework-bc1aa-firebase-adminsdk-fbsvc-749b8958de.json")
BASE_DIR_CHAVE = os.path.dirname(os.path.abspath(__file__)) # Pega a pasta atual (backend/)
PATH_COMPLETO_CHAVE = os.path.join(BASE_DIR_CHAVE, CHAVE_NAME)

if not firebase_admin._apps:
    try:
        if os.path.exists(PATH_COMPLETO_CHAVE):
            cred = credentials.Certificate(PATH_COMPLETO_CHAVE)
            firebase_admin.initialize_app(cred)
            logger.info(f"🔥 [FIREBASE] Inicializado com sucesso usando {CHAVE_NAME}")
        else:
            # Caso esteja um nível acima ou na raiz geral do SafeWork
            caminho_alternativo = os.path.join(os.path.dirname(BASE_DIR_CHAVE), CHAVE_NAME)
            if os.path.exists(caminho_alternativo):
                cred = credentials.Certificate(caminho_alternativo)
                firebase_admin.initialize_app(cred)
                logger.info(f"🔥 [FIREBASE] Inicializado usando caminho alternativo: {caminho_alternativo}")
            else:
                logger.warning(f"⚠️ [AVISO FIREBASE] Arquivo JSON não encontrado em: {PATH_COMPLETO_CHAVE}")
    except Exception as e:
        logger.error(f"❌ [ERRO FIREBASE] Falha ao inicializar Admin SDK: {e}")

# 3. Inicialização do App FastAPI
app = FastAPI(
    title="SafeWork API",
    description="Sistema de Monitoramento de EPI",
    version="1.0.0"
)

# Estado global para o interruptor da IA controlado pelo RH
app.state.cadastro_rh_ativo = False

# =========================================================================
# ⚙️ CONFIGURAÇÃO COMPLETA E EXPLICITA DE CORS (Resolve o bloqueio do Front)
# =========================================================================
# Listamos todas as variações possíveis que o navegador usa para o ambiente local
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # 🔥 Aponta para a lista explícita acima
    allow_credentials=True,       # 🔥 ATIVADO! Permite que o Axios envie os tokens do Firebase
    allow_methods=["*"],          # Permite GET, POST, OPTIONS, PUT, DELETE, etc.
    allow_headers=["*"],          # Aceita headers como Authorization e Content-Type
    expose_headers=["*"]          # Permite que o Axios leia a resposta limpa do servidor
)
# =========================================================================
# 📁 MONTAGEM DO DIRETÓRIO DE ARQUIVOS ESTÁTICOS IMAGENS DO ALERTA
# =========================================================================
BASE_DIR = os.getcwd()
pasta_static_absoluta = os.path.join(BASE_DIR, "static")
pasta_alertas_absoluta = os.path.join(pasta_static_absoluta, "alertas")

# Cria as pastas fisicamente caso elas não existam no seu projeto
os.makedirs(pasta_alertas_absoluta, exist_ok=True)
logger.info(f"📁 [SISTEMA] Servindo arquivos estáticos de: {pasta_static_absoluta}")

# Monta o prefixo /static para o navegador acessar o disco de forma estável
app.mount("/static", StaticFiles(directory=pasta_static_absoluta), name="static")

# =========================================================================
# 🔗 INCLUSÃO DAS ROTAS DO SISTEMA
# =========================================================================
app.include_router(auth_routes.router)
app.include_router(funcionario_routes.router) 
app.include_router(empresa_routes.router)
app.include_router(plano_routes.router)
app.include_router(seguranca_routes.router)
app.include_router(relatorios_routes.router)

# =========================================================================
# 🛟 PROTOCOLO DE RECOVERY ATUALIZADO: ACESSO DIRETO AO REPOSITORY REAL
# =========================================================================
@app.get("/bi/metricas")
@app.get("/bi/dashboard")
async def rota_raiz_bi_recovery():
    """
    Rota de compatibilidade na raiz que agora consome os dados reais e 
    vivos do SegurancaRepository, enviando tudo em formato plano para o React.
    """
    from database.database import SessionLocal
    from sqlalchemy import func
    from database.models.seguranca import DeteccaoModel
    from repositories.seguranca_repository import SegurancaRepository

    db = SessionLocal()
    try:
        logger.info("📡 [RECOVERY BI CORRIGIDO] Compilando dados REAIS diretamente do banco...")
        
        # 1. Puxa os cálculos reais direto do seu repositório de segurança
        kpis = SegurancaRepository.obter_dados_bi_geral(db)
        historico = SegurancaRepository.obter_historico_semanal_bi(db)
        distribuicao = SegurancaRepository.obter_distribuicao_epis_bi(db)
        
        # 2. Retorna a raiz limpa com os seus mais de 1600 dados para o front
        return {
            "total_alertas": kpis.get("total_alertas", 0),
            "total_infracoes": kpis.get("total_infracoes", 0),
            "taxa_conformidade": kpis.get("taxa_conformidade", "100%"),
            "tempo_resposta_medio": kpis.get("tempo_resposta_medio", "1.2s"),
            "historico": historico,
            "distribuicao": distribuicao
        }

    except Exception as e:
        logger.error(f"❌ [RECOVERY BI] Erro ao conectar ao banco real: {str(e)}")
        # Fallback de última hora apenas se o banco de dados cair completamente
        return {
            "total_alertas": 0,
            "total_infracoes": 0,
            "taxa_conformidade": "0%",
            "tempo_resposta_medio": "0s",
            "historico": [],
            "distribuicao": []
        }
    finally:
        db.close()