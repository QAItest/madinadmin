"""Conformité API — run Contrôleur audit on a dossier."""
from __future__ import annotations

import logging
from datetime import date
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend._common import MODEL_OPUS, get_anthropic_client, get_controle_path
from backend.database import get_db
from backend.models import Dossier, Journal, Livrable

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ConformiteCheckRequest(BaseModel):
    dossier_id: int


class ConformiteCheckResponse(BaseModel):
    dossier_id: int
    decision: str
    items_verts: int
    items_orange: int
    items_rouges: int
    chemin_rapport: str
    livrable_id: int


# ---------------------------------------------------------------------------
# Contrôleur system prompt
# ---------------------------------------------------------------------------

CONTROLEUR_SYSTEM_PROMPT = """
Tu es le Contrôleur de Madin'Admin, auditeur de conformité pour les dossiers FEDER/FSE+.

Analyse le dossier fourni et produis un rapport de conformité complet au format Markdown avec YAML frontmatter.
Le frontmatter doit inclure : items_verts, items_orange, items_rouges, bloquants (liste), decision (VALIDÉ|REJETÉ|EN ATTENTE).

RÈGLES ABSOLUES :
- Ne jamais retourner VALIDÉ si au moins 1 item est ROUGE BLOQUANT.
- Vérifier arithmétiquement tous les totaux budgétaires.
- Citer la source réglementaire pour chaque non-conformité.
- DONNÉES MANQUANTES est une réponse valide.
"""


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/check", response_model=ConformiteCheckResponse)
def check_conformite(payload: ConformiteCheckRequest, db: Session = Depends(get_db)):
    """
    Run the Contrôleur agent on a full dossier.
    Reads existing livrables from the DB and the file system, then calls the agent.
    """
    dossier = db.query(Dossier).filter(Dossier.id == payload.dossier_id).first()
    if not dossier:
        raise HTTPException(status_code=404, detail="Dossier introuvable.")

    # Collect existing section content from livrables
    livrables = (
        db.query(Livrable)
        .filter(Livrable.dossier_id == dossier.id)
        .all()
    )

    sections_text = []
    for liv in livrables:
        if liv.chemin_fichier:
            p = Path(liv.chemin_fichier)
            if p.exists():
                sections_text.append(f"### {liv.type_livrable}\n{p.read_text(encoding='utf-8')[:2000]}")

    dossier_summary = (
        f"Porteur: {dossier.porteur_slug}\n"
        f"Dispositif: {dossier.dispositif}\n"
        f"Projet: {dossier.nom_projet}\n"
        f"Statut actuel: {dossier.statut}\n\n"
        + "\n\n".join(sections_text)
    )

    client = get_anthropic_client()
    try:
        message = client.messages.create(
            model=MODEL_OPUS,
            max_tokens=4096,
            system=CONTROLEUR_SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"## Dossier à auditer\n\n{dossier_summary}\n\n"
                        "Produis le rapport de conformité complet avec le frontmatter YAML."
                    ),
                }
            ],
        )
    except Exception as exc:
        logger.error("Anthropic API error: %s", exc)
        raise HTTPException(status_code=502, detail=f"Erreur agent Contrôleur: {exc}") from exc

    md_content = message.content[0].text

    # Extract frontmatter fields
    def _get_field(content: str, field: str, default: str = "0") -> str:
        for line in content.splitlines():
            if line.startswith(f"{field}:"):
                return line.split(":", 1)[1].strip()
        return default

    decision = _get_field(md_content, "decision", "EN ATTENTE")
    items_verts = int(_get_field(md_content, "items_verts", "0"))
    items_orange = int(_get_field(md_content, "items_orange", "0"))
    items_rouges = int(_get_field(md_content, "items_rouges", "0"))

    # Write rapport
    today = date.today()
    dossier_slug = f"{dossier.porteur_slug}-{dossier.dispositif}"
    rapport_path = get_controle_path(dossier_slug, today)
    rapport_path.write_text(md_content, encoding="utf-8")

    # Persist livrable
    livrable = Livrable(
        dossier_id=dossier.id,
        porteur_slug=dossier.porteur_slug,
        agent="controleur",
        type_livrable="rapport-conformite",
        chemin_fichier=str(rapport_path),
        contenu=md_content[:5000],
        version=1,
        statut="brouillon",
        metadata={
            "decision": decision,
            "items_verts": items_verts,
            "items_orange": items_orange,
            "items_rouges": items_rouges,
        },
    )
    db.add(livrable)

    dossier.statut = "controle"
    dossier.etape_courante = 4

    db.add(Journal(
        dossier_id=dossier.id,
        porteur_slug=dossier.porteur_slug,
        agent="controleur",
        action=f"Audit de conformité — Décision: {decision}",
        details=f"Verts: {items_verts}, Orange: {items_orange}, Rouges: {items_rouges}",
        version_apres=1,
    ))
    db.commit()
    db.refresh(livrable)

    return ConformiteCheckResponse(
        dossier_id=dossier.id,
        decision=decision,
        items_verts=items_verts,
        items_orange=items_orange,
        items_rouges=items_rouges,
        chemin_rapport=str(rapport_path),
        livrable_id=livrable.id,
    )
