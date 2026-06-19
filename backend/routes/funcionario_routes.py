from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database.database import get_db, get_current_user # 🔐 Importando o protetor do Firebase
from repositories.funcionario_repository import FuncionarioRepository
from controllers.funcionario_controller import FuncionarioController
from schemas.funcionario_schema import FuncionarioCreate, FuncionarioResponse
import os
import base64
router = APIRouter(prefix="/funcionarios", tags=["Funcionários"])

@router.post("/", response_model=FuncionarioResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_funcionario(
    funcionario_in: FuncionarioCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Rota protegida para cadastrar um novo funcionário e salvar sua biometria facial.
    """
    
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
    
    try:
        return controller.cadastrar(funcionario_in)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/empresa/{id_empresa}", response_model=List[FuncionarioResponse])
def listar_funcionarios_por_empresa(
    id_empresa: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Rota protegida para listar funcionários de uma empresa.
    """
    # 💡 Fazemos a mesma coisa aqui para a rota de listagem
    conexao_psycopg2 = db.connection().connection
    controller = FuncionarioController(conexao_psycopg2)
    
    return controller.listar_por_empresa(id_empresa)