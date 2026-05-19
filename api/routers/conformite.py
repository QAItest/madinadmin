from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class ConformiteRequest(BaseModel):
    dossier: str

@router.post("/check")
def check_conformite(payload: ConformiteRequest) -> dict[str, str]:
    return {
        "status": "stub",
        "agent": "controleur",
        "message": "Verifier coherence, budgets, signatures, publicite et alertes rouges."
    }