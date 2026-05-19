from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class DiagnosticRequest(BaseModel):
    porteur: str
    territoire: str
    structure: str
    projet: str

@router.post("/run")
def run_diagnostic(payload: DiagnosticRequest) -> dict[str, str]:
    return {
        "status": "stub",
        "agent": "diagnostiqueur",
        "message": "Connecter ici l'orchestrateur et la matrice des dispositifs."
    }