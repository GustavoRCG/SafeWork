import firebase_admin
import os
from firebase_admin import credentials, auth
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials 
from pathlib import Path

# 1. Caminho Dinâmico Corrigido
# Sobe 3 níveis (database -> backend -> src -> SafeWork) para achar o JSON na raiz do projeto
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
JSON_PATH = BASE_DIR / "safework-bc1aa-firebase-adminsdk-fbsvc-89135f3f6d.json" 

# Evita erro de "App already exists" no Firebase
if not firebase_admin._apps:
    try:
        if JSON_PATH.exists():
            cred = credentials.Certificate(str(JSON_PATH))
            firebase_admin.initialize_app(cred)
        else:
            # Caso o arquivo não seja achado por diferença de execução no terminal
            print(f"⚠️ Alerta Config: JSON não encontrado em {JSON_PATH}. Usando inicialização global.")
    except Exception as e:
        print(f"Erro ao inicializar Firebase no config: {e}")

security = HTTPBearer()

async def get_current_user(res: HTTPAuthorizationCredentials = Security(security)):
    token = res.credentials
    try:
        # 2. Valida o token JWT do Firebase
        decoded_token = auth.verify_id_token(token, check_revoked=True)
        return decoded_token 
        
    except auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Token revogado. Faça login novamente."
        )
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Sessão expirada."
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Falha na autenticação SafeWork."
        )