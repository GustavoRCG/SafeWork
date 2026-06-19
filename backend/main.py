import os
import firebase_admin
from firebase_admin import credentials
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes import auth_routes, funcionario_routes, empresa_routes, plano_routes, seguranca_routes
from database import database
from database import models  
# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

# 2. Configuração do Caminho da Chave Firebase
CHAVE_NAME = os.getenv("FIREBASE_KEY_PATH", "safework-bc1aa-firebase-adminsdk-fbsvc-89135f3f6d.json")

# Lógica para garantir que o Python ache o arquivo na raiz do projeto (SafeWork/)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PATH_COMPLETO_CHAVE = os.path.join(BASE_DIR, CHAVE_NAME)

# 3. Inicialização Única do Firebase
if not firebase_admin._apps:
    try:
        if os.path.exists(PATH_COMPLETO_CHAVE):
            cred = credentials.Certificate(PATH_COMPLETO_CHAVE)
            firebase_admin.initialize_app(cred)
            print(f"Firebase: Inicializado com sucesso usando {CHAVE_NAME}")
        else:
            print(f"ERRO: Arquivo de chave não encontrado em: {PATH_COMPLETO_CHAVE}")
            print("Verifique se o arquivo .json está na pasta raiz 'SafeWork/'.")
    except Exception as e:
        print(f"ERRO CRÍTICO ao inicializar Firebase: {e}")

# 4. Configuração do App FastAPI
app = FastAPI(
    title="SafeWork API - Sistema de Monitoramento de EPI",
    description="Backend estruturado em POO para gestão de segurança do trabalho com IA.",
    version="1.0.0"
)

app.state.cadastro_rh_ativo = False

@app.post("/api/monitoramento/yolo/desativar", tags=["IA Controle"])
async def desativar_yolo():
    app.state.cadastro_rh_ativo = True
    return {"status": "YOLO congelado. Modo cadastro ativado."}

@app.post("/api/monitoramento/yolo/ativar", tags=["IA Controle"])
async def ativar_yolo():
    app.state.cadastro_rh_ativo = False
    return {"status": "YOLO reativado. Monitoramento de EPI online."}

# 5. Configuração de CORS (Libera acesso para o Frontend React/Vue/Mobile)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(funcionario_routes.router) 
app.include_router(empresa_routes.router)
app.include_router(plano_routes.router)
app.include_router(seguranca_routes.router)

# 7. Rota de Boas-vindas (Health Check)
@app.get("/", tags=["Root"])
async def root():
    return {
        "status": "SafeWork Online",
        "database": "Conectado",
        "firebase": "Ativo" if firebase_admin._apps else "Inativo",
        "docs": "/docs"
    }

# 8. Execução do Servidor (Caso rode o arquivo diretamente)
if __name__ == "__main__":
    import uvicorn
    # Mantido o caminho completo para execução a partir da raiz do projeto
    uvicorn.run("src.backend.main:app", host="127.0.0.1", port=8000, reload=True)