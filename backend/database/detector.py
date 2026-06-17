

import cv2
import requests
import time
import threading
import os
import unicodedata
from ultralytics import YOLO
from database.database import SessionLocal

from database.recognition import ReconhecedorFacial



#MODEL_PATH = "yolo11n.pt"
MODEL_PATH = r"C:\users\gusta\onedrive\documentos\safework_tcc-main\safework_tcc-main\runs\detect\safework_treino_atualizado\weights\best.pt"
model = YOLO(MODEL_PATH)

DATASET_PATH = "dataset"
if not os.path.exists(DATASET_PATH):
    os.makedirs(DATASET_PATH, exist_ok=True)

reconhecedor = ReconhecedorFacial(db_path=DATASET_PATH)
os.makedirs("storage/ocorrencias", exist_ok=True)

INTERVALO_MINIMO = 10 
ultima_infracao = 0

# Dicionário de tradução corrigido para coincidir com o 'if'
TRADUCOES = {
    "NO-Hardhat": "Sem Capacete",
    "Safety Cone": "Cone de Segurança",
    "Hardhat": "Capacete",
    "Mask": "Mascara",
    "Safety Vest": "Colete"
}

def limpar_texto(texto):
    nfkd = unicodedata.normalize('NFKD', str(texto))
    return "".join([c for c in nfkd if not unicodedata.combining(c)])

# Inicialização
model = YOLO(MODEL_PATH)
reconhecedor = ReconhecedorFacial(db_path="dataset/faces")
os.makedirs("storage/ocorrencias", exist_ok=True)

def salvar_deteccao_db(dados):
    """
    Recebe os dados processados pelo YOLO e salva diretamente 
    na tabela public.deteccoes do PostgreSQL usando a SessionLocal.
    """
    # Cria uma sessão limpa com o banco de dados
    from database.models import DeteccaoModel
    db: Session = SessionLocal()
    try:
        # Traduz a classe vinda do YOLO (Ex: 'NO-Hardhat' vira 'Sem Capacete')
        tipo_bruto = dados.get('tipo', 'Nenhum')
        tipo_traduzido = TRADUCOES.get(type_bruto, tipo_bruto)

        # Instancia usando o modelo real do seu banco (DeteccaoModel)
        nova_deteccao = DeteccaoModel(
            id_camera=1,
            id_funcionario=dados.get('id_funcionario'),
            tipo_falta_epi=dados.get('tipo'),
            path_imagem_original=dados.get('path_original', ''),
            path_imagem_blur=dados.get('path_blur', ''),
            confianca_ia=str(dados.get('confianca', 0.0)) 
        )
        
        db.add(nova_deteccao)
        db.commit()
        print(f"[SafeWork Banco] Infração '{tipo_traduzido}' salva com sucesso!")
        
    except Exception as e:
        db.rollback()
        print(f"[SafeWork Erro] Falha ao salvar infração no banco: {str(e)}")
    finally:
        db.close()