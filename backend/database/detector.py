import cv2
import requests
import time
import threading
import os
import unicodedata
from ultralytics import YOLO
from database.database import SessionLocal
from sqlalchemy.orm import Session

from database.recognition import ReconhecedorFacial

# 📂 CAMINHOS DO MODELO E CONFIGURAÇÕES
MODEL_PATH = r"C:\users\gusta\onedrive\documentos\safework_tcc-main\safework_tcc-main\runs\detect\safework_treino_atualizado\weights\best.pt"
model = YOLO(MODEL_PATH)

DATASET_PATH = "dataset/faces"
if not os.path.exists(DATASET_PATH):
    os.makedirs(DATASET_PATH, exist_ok=True)

reconhecedor = ReconhecedorFacial(db_path=DATASET_PATH)
os.makedirs("storage/ocorrencias", exist_ok=True)

INTERVALO_MINIMO = 10 
ultima_infracao = 0

# 🎯 DICIONÁRIO DE TRADUÇÃO UNIFICADO (Conversando com as classes reais do YOLO)
TRADUCOES = {
    "no-hardhat": "Sem Capacete",
    "no-safety vest": "Sem Colete",
    "no-mask": "Sem Máscara"
}

def limpar_texto(texto):
    nfkd = unicodedata.normalize('NFKD', str(texto))
    return "".join([c for c in nfkd if not unicodedata.combining(c)])

# =========================================================================
# 💾 GRAVAÇÃO COMPATÍVEL COM O PAYLOAD DAS ROTAS FastEPI
# =========================================================================
def salvar_deteccao_db(dados):
    """
    Recebe os dados processados pelo YOLO e salva na tabela public.deteccoes
    forçando o horário local do sistema operacional.
    """
    from database.models.seguranca import DeteccaoModel
    from datetime import datetime
    
    db: Session = SessionLocal()
    try:
        tipo_original = dados.get('tipo_falta_epi') or dados.get('tipo', 'Nenhum')
        
        if tipo_original in TRADUCOES:
            tipo_final = TRADUCOES[tipo_original]
        elif not tipo_original.startswith("Sem "):
            tipo_final = f"Sem {tipo_original.title()}"
        else:
            tipo_final = tipo_original

        # 🕒 Pega o horário atual da sua barra de tarefas/sistema
        horario_local = datetime.now() 

        nova_deteccao = DeteccaoModel(
            id_camera=dados.get('id_camera', 1),
            id_funcionario=dados.get('id_funcionario'), 
            tipo_falta_epi=tipo_final,
            path_imagem_original=dados.get('path_original', ''),
            path_imagem_blur=dados.get('path_blur', ''),
            confianca_ia=dados.get('confianca_ia') or dados.get('confianca', 0.0),
            data_hora=horario_local # 🌟 Grava o datetime puro
        )
        
        db.add(nova_deteccao)
        db.commit()
        db.refresh(nova_deteccao)
        print(f"[SafeWork Banco] Infração '{tipo_final}' salva com sucesso às {horario_local.strftime('%H:%M:%S')}!")
        return nova_deteccao
        
    except Exception as e:
        db.rollback()
        print(f"[SafeWork Erro] Falha ao salvar infração no banco: {str(e)}")
        raise e
    finally:
        db.close()