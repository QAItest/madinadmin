"""Dossiers API — build dossier sections via the Monteur agent."""
from __future__ import annotations

import logging
from datetime import date
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend._common import (
    MODEL_SONNET,
    get_anthropic_client,
    get_dossier_path,
    read_porteur_profile,
)
from backend.database import get_db
from backend.models import Dossier, Journal, Livrable

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class DossierBuildRequest(BaseModel):
    dossier_id: int
    section: Optional[str] = None  # if None, build all 9 sections


class LivrableOut(BaseModel):
    id: int
    agent: str
    type_livrable: str
    chemin_fichier: Optional[str]
    version: int
    statut: str

    model_config = {"from_attributes": True}


class DossierOut(BaseModel):
    id: int
    porteur_slug: Optional[str]
    dispositif: str
    nom_projet: str
    statut: str
    etape_courante: int
    livrables: list[LivrableOut] = []

    model_config = {"from_attributes": True}


class DossierBuildResponse(BaseModel):
    dossier_id: int
    sections_written: list[str]
    dossier_path: str


# ---------------------------------------------------------------------------
# Monteur system prompt
# ---------------------------------------------------------------------------

MONTEUR_SYSTEM_PROMPT = """
Tu es le Monteur de Madin'Admin, expert en rédaction de dossiers de subvention européenne FEDER/FSE+.

Rédige la section demandée du dossier en Markdown, avec un bloc YAML frontmatter complet.
Utilise la logique d'intervention européenne, le cadre logique et la théorie du changement.
Tous les indicateurs doivent être SMART et liés aux objectifs du Programme Opérationnel régional.
Ne jamais inventer de chiffres. Indiquer DONNÉE MANQUANTE si une information est absente.
"""

SECTIONS = {
    "01": "description-projet",
    "02": "objectifs",
    "03": "theorie-changement",
    "04": "budget",
    "05": "calendrier",
    "06": "public-cible",
    "07": "indicateurs",
    "08": "impacts",
    "09": "plan-financement",
}


def _write_section(
    dossier: Dossier,
    section_num: str,
    section_name: str,
    porteur_profile: str,
    dossier_path: Path,
) -> Path:
    """Call the Monteur agent and write one section to disk."""
    client = get_anthropic_client()
    message = client.messages.create(
        model=MODEL_SONNET,
        max_tokens=4096,
        system=MONTEUR_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    f"## Profil porteur\n{porteur_profile}\n\n"
                    f"## Dossier\nDispositif : {dossier.dispositif}\n"
                    f"Projet : {dossier.nom_projet}\n\n"
                    f"Rédige la **Section {section_num} — {section_name}** du dossier FEDER."
                ),
            }
        ],
    )
    content = message.content[0].text
    sections_dir = dossier_path / "sections"
    sections_dir.mkdir(parents=True, exist_ok=True)
    file_path = sections_dir / f"{section_num}-{section_name}.md"
    file_path.write_text(content, encoding="utf-8")
    return file_path


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/build", response_model=DossierBuildResponse)
def build_dossier(payload: DossierBuildRequest, db: Session = Depends(get_db)):
    """
    Call the Monteur agent to write dossier sections.
    If payload.section is None, writes all 9 sections.
    """
    dossier = db.query(Dossier).filter(Dossier.id == payload.dossier_id).first()
    if not dossier:
        raise HTTPException(status_code=404, detail="Dossier introuvable.")

    porteur_profile = read_porteur_profile(dossier.porteur_slug or "")
    if porteur_profile is None:
        porteur_profile = f"Porteur : {dossier.porteur_slug}\nProjet : {dossier.nom_projet}"

    today = date.today()
    dossier_slug = f"{today.isoformat()}-{dossier.porteur_slug}-{dossier.dispositif}"
    dossier_path = get_dossier_path(dossier.porteur_slug or "", dossier.dispositif, today)

    sections_to_build = (
        {payload.section: SECTIONS[payload.section]}
        if payload.section and payload.section in SECTIONS
        else SECTIONS
    )

    written = []
    for num, name in sections_to_build.items():
        try:
            file_path = _write_section(dossier, num, name, porteur_profile, dossier_path)
            written.append(str(file_path))

            livrable = Livrable(
                dossier_id=dossier.id,
                porteur_slug=dossier.porteur_slug,
                agent="monteur",
                type_livrable=f"section-{num}",
                chemin_fichier=str(file_path),
                version=1,
                statut="brouillon",
            )
            db.add(livrable)
        except Exception as exc:
            logger.error("Error writing section %s: %s", num, exc)

    dossier.statut = "montage"
    dossier.etape_courante = 2

    journal = Journal(
        dossier_id=dossier.id,
        porteur_slug=dossier.porteur_slug,
        agent="monteur",
        action=f"Sections rédigées: {', '.join(sections_to_build.keys())}",
        details=f"Dossier path: {dossier_path}",
        version_apres=1,
    )
    db.add(journal)
    db.commit()

    return DossierBuildResponse(
        dossier_id=dossier.id,
        sections_written=written,
        dossier_path=str(dossier_path),
    )


@router.get("/", response_model=list[DossierOut])
def list_dossiers(db: Session = Depends(get_db)):
    """List all dossiers with their livrables."""
    dossiers = db.query(Dossier).order_by(Dossier.created_at.desc()).all()
    return dossiers


@router.get("/{dossier_id}", response_model=DossierOut)
def get_dossier(dossier_id: int, db: Session = Depends(get_db)):
    """Get a single dossier with its livrables."""
    dossier = db.query(Dossier).filter(Dossier.id == dossier_id).first()
    if not dossier:
        raise HTTPException(status_code=404, detail="Dossier introuvable.")
    return dossier
