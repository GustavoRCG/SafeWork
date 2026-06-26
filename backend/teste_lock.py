import threading
import time
from utils.logger import gravar_log_seguranca_com_lock

def simular_camera(id_camera):
    # Tenta gravar o log simulando uma infração
    gravar_log_seguranca_com_lock(id_camera=str(id_camera), tipo_infracao="Capacete")

# Cria uma lista para guardar as threads (processos paralelos)
threads = []

print("Iniciando teste de concorrência com 50 câmeras simultâneas...")

# Inicia 50 detecções AO MESMO TEMPO
for i in range(1, 51):
    t = threading.Thread(target=simular_camera, args=(i,))
    threads.append(t)
    t.start()

# Espera todas terminarem
for t in threads:
    t.join()

print("Teste finalizado! Abra o arquivo safework_infracoes.log e veja o resultado.")