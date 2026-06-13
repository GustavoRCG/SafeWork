from pydantic import BaseModel
from typing import List, Dict

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