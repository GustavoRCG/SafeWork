import threading
import datetime

# 1. Cria a instância do Cadeado (Lock)
log_lock = threading.Lock()

def gravar_log_seguranca_com_lock(id_camera: str, tipo_infracao: str):
    """
    Função que grava uma infração em um arquivo de texto de forma segura contra concorrência.
    """
    mensagem = f"ALERTA: Câmera {id_camera} detectou falta de {tipo_infracao}."
    
    # 2. O comando 'with' adquire o cadeado automaticamente e solta quando terminar
    with log_lock:
        # A partir desta linha, apenas UMA thread consegue executar por vez
        try:
            # Abre o arquivo de log em modo 'append' (adicionar ao final)
            with open("safework_infracoes.log", "a", encoding="utf-8") as arquivo_log:
                agora = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                arquivo_log.write(f"[{agora}] {mensagem}\n")
                
        except Exception as e:
            print(f"Erro ao gravar log: {str(e)}")