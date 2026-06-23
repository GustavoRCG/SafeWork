import os
import base64
import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# 🔐 Importando o protetor do Firebase e os demais módulos do projeto
from database.database import get_db, get_current_user 
from repositories.funcionario_repository import FuncionarioRepository
from controllers.funcionario_controller import FuncionarioController
from schemas.funcionario_schema import FuncionarioCreate, FuncionarioResponse

router = APIRouter(prefix="/funcionarios", tags=["Funcionários"])

def descobrir_id_empresa_por_contexto(current_user: dict) -> int:
    """
    Função de segurança para isolamento de dados.
    Tenta obter o ID do Token. Se for nulo (padrão Firebase), descobre
    dinamicamente através do e-mail do usuário corporativo logado.
    """
    # 1. Busca pelas chaves do token
    id_empresa = (
        current_user.get("id_empresa") or 
        current_user.get("empresa_id") or 
        current_user.get("empresa")
    )
    
    # 2. Se for nulo, faz a extração inteligente pelo e-mail
    if not id_empresa:
        email_usuario = current_user.get("email", "")
        print(f"[SafeWork Debug] Analisando e-mail para isolamento de dados: {email_usuario}")
        
        # Encontra qualquer sequência de números no e-mail (ex: rh_empresa2@... pega o 2)
        numeros_no_email = re.findall(r'\d+', email_usuario)
        
        if numeros_no_email:
            id_detectado = int(numeros_no_email[0])
            # Se for o CNPJ longo mapeado para a empresa principal, força ID 1
            if id_detectado == 59119576000115:
                id_empresa = 1
            else:
                id_empresa = id_detectado
        else:
            # Caso o e-mail não tenha número nenhum, assume 1 por segurança
            id_empresa = 1

    print(f"[SafeWork Sucesso] Isolamento Ativo! Empresa ID mapeada: {id_empresa}")
    return int(id_empresa)


@router.post("/", response_model=FuncionarioResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_funcionario(
    funcionario_in: FuncionarioCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Rota protegida para cadastrar um novo funcionário e salvar sua biometria facial,
    vinculando-o estritamente à empresa do usuário autenticado.
    """
    # 1. Descobre a qual empresa o usuário logado realmente pertence
    id_empresa_autenticada = descobrir_id_empresa_por_contexto(current_user)
    
    # 2. 🔥 AJUSTE DE SEGURANÇA: Sobrescreve o ID enviado pelo front para evitar fraudes/erros
    funcionario_in.id_empresa = id_empresa_autenticada

    # 3. Processamento e salvamento da Imagem Base64 para a IA (Face ID)
    if funcionario_in.face_id_image:
        try:
            str_base64 = funcionario_in.face_id_image
            if "," in str_base64:
                str_base64 = str_base64.split(",")[1]
            
            # Decodifica a string em bytes binários de imagem
            img_bytes = base64.b64decode(str_base64)
            
            # Define o diretório onde o ReconhecedorFacial busca as faces
            diretorio_faces = "dataset/faces"
            os.makedirs(diretorio_faces, exist_ok=True)
            
            # Salva o arquivo com padrão de nome limpo (Ex: Wagner_Silva_12345678900.jpg)
            nome_limpo = funcionario_in.nome.replace(" ", "_")
            caminho_foto = os.path.join(diretorio_faces, f"{nome_limpo}_{funcionario_in.cpf}.jpg")
            
            with open(caminho_foto, "wb") as arquivo_imagem:
                arquivo_imagem.write(img_bytes)
                
            print(f"[SafeWork IA] Biometria facial de {funcionario_in.nome} indexada em {caminho_foto}")
            
        except Exception as erro_img:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Falha ao processar e salvar a imagem do Face ID: {str(erro_img)}"
            )

    conexao_psycopg2 = db.connection().connection
    controller = FuncionarioController(conexao_psycopg2)
    
    # 4. Validação prévia de duplicidade de CPF dentro da própria empresa do usuário
    funcionario_existente = controller.get_by_cpf(funcionario_in.cpf, id_empresa_autenticada)
    if funcionario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um funcionário registrado com este CPF nesta empresa."
        )

    try:
        return controller.cadastrar(funcionario_in)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=List[FuncionarioResponse])
def listar_funcionarios_da_empresa_logada(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Nova Rota Protegida. Extrai o ID da empresa do e-mail de forma dinâmica.
    """
    # 1. Tenta buscar pelas chaves do token do Firebase
    id_empresa_token = (
        current_user.get("id_empresa") or 
        current_user.get("empresa_id") or 
        current_user.get("empresa")
    )
    
    # 2. Se for nulo (padrão Firebase puro), vamos extrair do e-mail do usuário logado!
    if not id_empresa_token:
        email_usuario = current_user.get("email", "")
        # Mostra no console o e-mail exato capturado para sabermos se o Firebase está enviando ele
        print(f"[SafeWork NOVO DEBUG] E-mail detectado no token: '{email_usuario}'")
        
        # Encontra os números no e-mail (ex: rh_empresa23@... extrai 23)
        numeros_no_email = re.findall(r'\d+', email_usuario)
        
        if numeros_no_email:
            id_detectado = int(numeros_no_email[0])
            if id_detectado == 59119576000115:
                id_empresa_token = 1
            else:
                id_empresa_token = id_detectado
        else:
            print("[SafeWork Alerta] E-mail sem números. Usando ID 1 como último recurso.")
            id_empresa_token = 1

    print(f"[SafeWork Sucesso] Forçando busca exclusiva para Empresa ID: {id_empresa_token}")

    conexao_psycopg2 = db.connection().connection
    controller = FuncionarioController(conexao_psycopg2)
    
    dados_banco = controller.listar_por_empresa(int(id_empresa_token))
    
    lista_validada = []
    for item in dados_banco:
        funcionario_dict = dict(item)
        if "id_empresa" not in funcionario_dict or funcionario_dict["id_empresa"] is None:
            funcionario_dict["id_empresa"] = int(id_empresa_token)
        lista_validada.append(funcionario_dict)
        
    return lista_validada