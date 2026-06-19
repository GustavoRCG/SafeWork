import requests

def disparar_deteccao(imagem_bytes):
    # O backend envia a imagem para o seu microserviço
    response = requests.post("http://localhost:8000/predict", files={"file": imagem_bytes})
    
    if response.status_code == 200:
        dados = response.json()
        # Agora sim, seu backend salva os dados no Postgres
        salvar_deteccao(dados)