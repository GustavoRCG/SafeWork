import requests

def enviar_para_ia(caminho_da_imagem):
    files = {'file': open(caminho_da_imagem, 'rb')}
    # O backend chama o serviço do YOLO que está rodando em outra porta
    response = requests.post("http://localhost:5000/predict", files=files)
    return response.json()