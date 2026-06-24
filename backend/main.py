import os
import logging
import firebase_admin
from firebase_admin import credentials
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

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
# ⚙️ CONFIGURAÇÃO COMPLETA E IRRESTRITA DE CORS (Previne ERR_CONNECTION_REFUSED)
# =========================================================================
# Liberado origins para "*" temporariamente ou listado explicitamente para não barrar requisições das métricas
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 🔥 Alterado para "*" para garantir que nenhuma métrica ou feed do front seja bloqueado por CORS
    allow_credentials=True if not "*" in ["*"] else False, # Adaptação de segurança do FastAPI para uso do "*"
    allow_methods=["*"],         # Permite GET, POST, OPTIONS, PUT, DELETE, etc.
    allow_headers=["*"],         # Aceita qualquer cabeçalho como Authorization e Content-Type
    expose_headers=["*"]         # Permite que o navegador exponha as respostas para o Axios
)

# Se você preferir manter restrito às suas portas locais sem usar o "*", descomente o bloco abaixo e comente o de cima:
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
#     expose_headers=["*"]
# )

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

# Rota base (Health Check)
@app.get("/")
async def root():
    return {
        "status": "SafeWork Online",
        "firebase": "Conectado" if firebase_admin._apps else "Desconectado",
        "static_files": "Ativo"
    }

# Bloco para execução local direta se necessário
if __name__ == "__main__":
    import uvicorn
    # Vincula ao host 0.0.0.0 para garantir que tanto localhost quanto 127.0.0.1 consigam se comunicar sem recusar conexões
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)