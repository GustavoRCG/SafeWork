import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth

# 1. Inicialização do Firebase Admin SDK
# Aponta para o arquivo JSON de chaves na raiz da pasta do backend
JSON_PATH = "safework-bc1aa-firebase-adminsdk-fbsvc-89135f3f6d.json"

if not firebase_admin._apps:
    if os.path.exists(JSON_PATH):
        cred = credentials.Certificate(JSON_PATH)
        firebase_admin.initialize_app(cred)
    else:
        # Fallback de segurança para não travar a inicialização se o arquivo não for achado
        print(f"⚠️ Alerta Config: JSON não encontrado em {os.path.abspath(JSON_PATH)}. Usando inicialização global.")
        firebase_admin.initialize_app()

# 2. Configura o esquema de segurança Bearer Token nativo do FastAPI
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependência injetável que extrai o token JWT enviado pelo React,
    retira o prefixo 'Bearer' automaticamente e valida a assinatura no Firebase.
    """
    token = credentials.credentials
    
    try:
        # Valida o token contra o servidor/SDK do Firebase
        decoded_token = auth.verify_id_token(token)
        return decoded_token
        
    except firebase_admin.auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="O token de autenticação enviado expirou. Faça login novamente no sistema.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except firebase_admin.auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação inválido ou corrompido.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Falha na validação de segurança: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )