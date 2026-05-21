"""Diagnostics API — run eligibility analysis via the Diagnostiqueur agent."""
from __future__ import annotations

import logging
from datetime import date
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend._common import (
    MODEL_OPUS,
    build_frontmatter,
    get_anthropic_client,
    get_diagnostic_path,
    get_dossier_path,
    read_porteur_profile,
)
from backend.database import get_db
from backend.models import Dossier, Journal, Livrable, Porteur

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class DiagnosticRunRequest(BaseModel):
    porteur_slug: str
    nom_porteur: str
    type_structure: Optional[str] = None
    secteur: Optional[str] = None
    territoire: str = "Martinique"
    contact_email: Optional[str] = None
    description_projet: str
    budget_estime: Optional[float] = None
    dispositif_vise: Optional[str] = None


class DiagnosticRunResponse(BaseModel):
    porteur_slug: str
    dossier_id: Optional[int]
    chemin_fichier: str
    eligibilite: str
    dispositifs_recommandes: list[str]
    resume: str
    livrable_id: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

DIAGNOSTIQUEUR_SYSTEM_PROMPT = """
Tu es le Diagnostiqueur de Madin'Admin, expert en éligibilité des fonds européens FEDER/FSE+
pour la Martinique et la Guadeloupe.

Analyse la situation du porteur et du projet fournis. Produis un rapport d'éligibilité structuré en Markdown
avec un bloc YAML frontmatter, en suivant strictement le format attendu.

RÈGLES ABSOLUES :
- Ne jamais inventer de montants ou de taux. Écrire "DONNÉE MANQUANTE" si une info est absente.
- "Non éligible" est une réponse valide et professionnelle.
- Ne jamais qualifier d'éligible un projet ne remplissant pas tous les critères stricts.
- Mentionner toujours la source réglementaire des critères d'éligibilité.
- Inclure dans le frontmatter YAML : eligibilite (ELIGIBLE|NON-ELIGIBLE|ELIGIBLE-SOUS-CONDITIONS),
  dispositifs_recommandes (liste), score_eligibilite (0-100).
"""


def _call_diagnostiqueur(porteur_info: str, description: str) -> str:
    """Call the Anthropic API with the Diagnostiqueur system prompt."""
    client = get_anthropic_client()
    message = client.messages.create(
        model=MODEL_OPUS,
        max_tokens=4096,
        system=DIAGNOSTIQUEUR_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    f"## Profil porteur\n{porteur_info}\n\n"
                    f"## Description du projet\n{description}\n\n"
                    "Produis le rapport d'éligibilité complet au format Markdown avec frontmatter YAML."
                ),
            }
        ],
    )
    return message.content[0].text


def _extract_frontmatter_field(content: str, field: str) -> str:
    """Naively extract a scalar value from YAML frontmatter."""
    for line in content.splitlines():
        if line.startswith(f"{field}:"):
            return line.split(":", 1)[1].strip()
    return "INCONNU"


def _extract_list_field(content: str, field: str) -> list[str]:
    """Extract a YAML list field from frontmatter."""
    lines = content.splitlines()
    result = []
    in_field = False
    for line in lines:
        if line.startswith(f"{field}:"):
            in_field = True
            continue
        if in_field:
            if line.startswith("  - "):
                result.append(line[4:].strip())
            else:
                break
    return result


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/run", response_model=DiagnosticRunResponse)
def run_diagnostic(payload: DiagnosticRunRequest, db: Session = Depends(get_db)):
    """
    Run the Diagnostiqueur agent on a porteur + project description.
    - Writes a Markdown file with YAML frontmatter to diagnostics/
    - Upserts the porteur in the DB
    - Creates a Dossier record (statut=diagnostic)
    - Creates a Livrable record
    Returns the DB record IDs and the file path.
    """
    # 1. Read or build porteur profile string
    profile = read_porteur_profile(payload.porteur_slug)
    if profile is None:
        # Build a minimal profile from the request payload
        profile = (
            f"Porteur : {payload.nom_porteur}\n"
            f"Type de structure : {payload.type_structure or 'Non précisé'}\n"
            f"Secteur : {payload.secteur or 'Non précisé'}\n"
            f"Territoire : {payload.territoire}\n"
            f"Contact : {payload.contact_email or 'Non précisé'}\n"
        )

    # 2. Upsert porteur in DB
    porteur_db = db.query(Porteur).filter(Porteur.slug == payload.porteur_slug).first()
    if not porteur_db:
        porteur_db = Porteur(
            slug=payload.porteur_slug,
            nom=payload.nom_porteur,
            type_structure=payload.type_structure,
            secteur=payload.secteur,
            territoire=payload.territoire,
            contact_email=payload.contact_email,
        )
        db.add(porteur_db)
        db.flush()

    # 3. Call the Diagnostiqueur agent
    try:
        md_content = _call_diagnostiqueur(profile, payload.description_projet)
    except Exception as exc:
        logger.error("Anthropic API error: %s", exc)
        raise HTTPException(status_code=502, detail=f"Erreur agent Diagnostiqueur: {exc}") from exc

    # 4. Extract key fields from generated content
    eligibilite = _extract_frontmatter_field(md_content, "eligibilite")
    dispositifs = _extract_list_field(md_content, "dispositifs_recommandes")
    if not dispositifs and payload.dispositif_vise:
        dispositifs = [payload.dispositif_vise]

    # 5. Write Markdown file
    today = date.today()
    md_path: Path = get_diagnostic_path(payload.porteur_slug, today)
    md_path.write_text(md_content, encoding="utf-8")
    logger.info("Diagnostic written to %s", md_path)

    # 6. Create Dossier record
    dispositif_key = dispositifs[0] if dispositifs else (payload.dispositif_vise or "feder")
    dossier_slug = f"{today.isoformat()}-{payload.porteur_slug}-{dispositif_key}"

    dossier_db = Dossier(
        porteur_slug=payload.porteur_slug,
        dispositif=dispositif_key,
        nom_projet=payload.description_projet[:500],
        statut="diagnostic",
        etape_courante=1,
    )
    db.add(dossier_db)
    db.flush()

    # 7. Create Livrable record
    livrable = Livrable(
        dossier_id=dossier_db.id,
        porteur_slug=payload.porteur_slug,
        agent="diagnostiqueur",
        type_livrable="rapport-eligibilite",
        chemin_fichier=str(md_path),
        contenu=md_content[:5000],  # store first 5000 chars
        version=1,
        statut="brouillon",
        metadata={
            "eligibilite": eligibilite,
            "dispositifs_recommandes": dispositifs,
        },
    )
    db.add(livrable)

    # 8. Journal entry
    journal = Journal(
        dossier_id=dossier_db.id,
        porteur_slug=payload.porteur_slug,
        agent="diagnostiqueur",
        action="Rapport d'éligibilité généré",
        details=f"Décision: {eligibilite} | Fichier: {md_path.name}",
        version_avant=None,
        version_apres=1,
    )
    db.add(journal)
    db.commit()
    db.refresh(livrable)

    # 9. Extract a short resume from the content
    lines = md_content.splitlines()
    resume_lines = [l for l in lines if l and not l.startswith("#") and not l.startswith("---") and not l.startswith("-")]
    resume = " ".join(resume_lines[:3])[:500]

    return DiagnosticRunResponse(
        porteur_slug=payload.porteur_slug,
        dossier_id=dossier_db.id,
        chemin_fichier=str(md_path),
        eligibilite=eligibilite,
        dispositifs_recommandes=dispositifs,
        resume=resume,
        livrable_id=livrable.id,
    )
