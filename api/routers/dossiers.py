from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class BuildDossierRequest(BaseModel):
    porteur: str
    dispositif: str
    diagnostic_path: str

@router.post("/build")
def build_dossier(payload: BuildDossierRequest) -> dict[str, str]:
    return {
        "status": "stub",
        "agent": "monteur",
        "message": "Generer les sections a partir du diagnostic valide."
    }