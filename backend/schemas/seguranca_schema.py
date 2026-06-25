from pydantic import BaseModel
from typing import List, Dict, Optional

class RegrasIA(BaseModel):
    capacete: bool
    colete: bool
    luvas: bool
    zonaRisco: bool

class ConfigIARequest(BaseModel):
    confianca_minima: int
    regras: RegrasIA

class AlertaResponse(BaseModel):
    id: str
    timestamp: str
    camera: str
    classe: str
    criticidade: str
    status: str
    foto_url: Optional[str] = None  # 👈 Evidência visual enviada para o React

    class Config:
        from_attributes = True

class CameraResponse(BaseModel):
    id: str
    nome: str
    ip: str
    zona: str
    status: str

    class Config:
        from_attributes = True

        from pydantic import BaseModel
from typing import List

class KpisBI(BaseModel):
    indice_conformidade_geral: float
    tendencia_conformidade: str
    frente_mais_segura: str
    frente_critica: str
    alertas_criticos_frente_critica: int

class HistoricoSemanalBI(BaseModel):
    dias: List[str]
    conformidade: List[int]
    alertas: List[int]

class DistribuicaoEpisBI(BaseModel):
    labels: List[str]
    valores: List[int]
    total: int

class DashboardBIResponse(BaseModel):
    kpis: KpisBI
    historico_semanal: HistoricoSemanalBI
    distribuicao_epis: DistribuicaoEpisBI