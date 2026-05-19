from fastapi import APIRouter

router = APIRouter()

@router.get("/esynergie/status")
def esynergie_status() -> dict[str, str]:
    return {"status": "stub", "service": "e-Synergie"}

@router.get("/demarches-simplifiees/status")
def demarches_status() -> dict[str, str]:
    return {"status": "stub", "service": "Demarches-Simplifiees"}