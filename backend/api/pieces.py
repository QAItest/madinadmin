"""Pièces & OCR API — extract structured data from uploaded documents."""
from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import Any, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class OcrAlert(BaseModel):
    type: str
    message: str
    criticite: str


class OcrResponse(BaseModel):
    document_id: str
    porteur_slug: Optional[str]
    type_document: str
    date_traitement: str
    score_confiance_global: int
    donnees: dict[str, Any]
    alertes: list[OcrAlert]
    champs_non_lisibles: list[str]
    action_recommandee: str


# ---------------------------------------------------------------------------
# Mock OCR logic (production: call Anthropic vision API or pytesseract)
# ---------------------------------------------------------------------------

def _mock_extract_kbis(filename: str) -> dict[str, Any]:
    today = date.today()
    expiry = today + timedelta(days=45)  # within 90-day validity
    return {
        "type_document": "kbis",
        "siren": "123 456 789",
        "siret_siege": "123 456 789 00012",
        "denomination_sociale": "Exemple SARL",
        "forme_juridique": "SARL",
        "capital_social": "10 000 €",
        "adresse_siege": {
            "numero": "12",
            "voie": "Rue Victor Hugo",
            "complement": "",
            "code_postal": "97200",
            "commune": "Fort-de-France",
            "territoire": "Martinique",
        },
        "date_immatriculation": "2018-03-15",
        "code_ape_naf": "6201Z",
        "activite_principale": "Programmation informatique",
        "representants_legaux": [
            {"nom": "DUPONT", "prenom": "Jean", "qualite": "Gérant"}
        ],
        "date_document": today.isoformat(),
        "date_expiration": expiry.isoformat(),
        "greffe": "Fort-de-France",
        "validite_ok": True,
    }


def _mock_extract_rib() -> dict[str, Any]:
    return {
        "type_document": "rib",
        "titulaire": "Exemple SARL",
        "banque": "Banque des Antilles Françaises",
        "code_banque": "12345",
        "code_guichet": "00001",
        "numero_compte": "12345678901",
        "cle_rib": "06",
        "iban": "FR76 1234 5000 0112 3456 7890 106",
        "bic_swift": "BDAFMQMX",
        "adresse_banque": "Fort-de-France, Martinique",
        "domiciliation": "Fort-de-France",
    }


def _mock_extract_attestation_fiscale() -> dict[str, Any]:
    today = date.today()
    expiry = today + timedelta(days=20)  # expiring soon — triggers alert
    return {
        "type_document": "attestation_fiscale",
        "emetteur": "DGFiP",
        "siret_beneficiaire": "123 456 789 00012",
        "denomination": "Exemple SARL",
        "date_emission": (today - timedelta(days=70)).isoformat(),
        "date_expiration": expiry.isoformat(),
        "regularite_constatee": True,
        "periode_couverte": "2024",
        "sip_competent": "SIP Fort-de-France",
        "reference": "REF-DGFiP-2024-XXXXX",
        "validite_ok": expiry > today,
    }


MOCK_DISPATCHERS = {
    "kbis": _mock_extract_kbis,
    "rib": _mock_extract_rib,
    "attestation_fiscale": _mock_extract_attestation_fiscale,
}


def _detect_document_type(filename: str) -> str:
    name_lower = filename.lower()
    if "kbis" in name_lower or "extrait" in name_lower:
        return "kbis"
    if "rib" in name_lower or "iban" in name_lower:
        return "rib"
    if "fiscal" in name_lower or "dgfip" in name_lower or "impot" in name_lower:
        return "attestation_fiscale"
    if "urssaf" in name_lower or "social" in name_lower:
        return "attestation_urssaf"
    if "statut" in name_lower:
        return "statuts"
    if "facture" in name_lower or "invoice" in name_lower:
        return "facture"
    if "devis" in name_lower:
        return "devis"
    return "inconnu"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/ocr", response_model=OcrResponse)
async def run_ocr(
    file: UploadFile = File(...),
    porteur_slug: Optional[str] = Form(None),
):
    """
    Accept a file upload and extract structured data from it.
    Currently returns structured mock data per document type.
    In production: call Anthropic vision API or a dedicated OCR service.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nom de fichier manquant.")

    doc_type = _detect_document_type(file.filename)
    today = date.today()

    # Dispatch to mock extractor
    if doc_type in MOCK_DISPATCHERS:
        fn = MOCK_DISPATCHERS[doc_type]
        import inspect
        if "filename" in inspect.signature(fn).parameters:
            donnees = fn(file.filename)
        else:
            donnees = fn()
    else:
        donnees = {
            "type_document": doc_type,
            "note": "Type de document non reconnu — extraction manuelle requise",
        }

    # Build alerts
    alertes: list[OcrAlert] = []
    expiry_str = donnees.get("date_expiration")
    if expiry_str:
        expiry = date.fromisoformat(expiry_str)
        days_remaining = (expiry - today).days
        if days_remaining < 0:
            alertes.append(OcrAlert(
                type="EXPIRE",
                message=f"Document expiré depuis le {expiry_str}. Renouvellement obligatoire.",
                criticite="CRITIQUE",
            ))
        elif days_remaining < 30:
            alertes.append(OcrAlert(
                type="EXPIRATION_PROCHE",
                message=f"Document expire dans {days_remaining} jours (le {expiry_str}). À renouveler avant le dépôt.",
                criticite="HAUTE",
            ))

    action = "Document valide — données extraites."
    if alertes:
        action = "Renouveler le document avant de constituer le dossier."

    return OcrResponse(
        document_id=f"{doc_type}-{today.isoformat()}-{file.filename}",
        porteur_slug=porteur_slug,
        type_document=doc_type,
        date_traitement=today.isoformat(),
        score_confiance_global=85 if doc_type != "inconnu" else 0,
        donnees=donnees,
        alertes=alertes,
        champs_non_lisibles=[],
        action_recommandee=action,
    )
