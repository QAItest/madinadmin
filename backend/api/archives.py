"""Archives API — generate audit package via the Archiviste agent."""
from __future__ import annotations

import logging
from datetime import date
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend._common import MODEL_OPUS, get_anthropic_client, get_archive_path, get_rapport_path
from backend.database import get_db
from backend.models import Dossier, Journal, Livrable

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ArchivePreuveRequest(BaseModel):
    dossier_id: int
    periode: str = "final"  # e.g. "2025-S1", "2025-annuel", "final"


class ArchivePreuveResponse(BaseModel):
    dossier_id: int
    periode: str
    chemin_rapport: str
    chemin_archive: str
    livrable_id: int


# ---------------------------------------------------------------------------
# Archiviste system prompt
# ---------------------------------------------------------------------------

ARCHIVISTE_SYSTEM_PROMPT = """
Tu es l'Archiviste de Madin'Admin, expert en reporting et archivage des dossiers FEDER/FSE+.

Génère un rapport de pilotage complet pour la période demandée, au format Markdown avec YAML frontmatter.
Inclure : résumé exécutif, avancement physique et financier, indicateurs, risques, recommandations.
Les archives doivent garantir la traçabilité décisionnelle complète depuis le diagnostic initial.
Conservation obligatoire 10 ans post-clôture programme.
"""


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/preuve", response_model=ArchivePreuveResponse)
def generate_archive(payload: ArchivePreuveRequest, db: Session = Depends(get_db)):
    """
    Run the Archiviste agent to generate a progress report and audit package.
    """
    dossier = db.query(Dossier).filter(Dossier.id == payload.dossier_id).first()
    if not dossier:
        raise HTTPException(status_code=404, detail="Dossier introuvable.")

    # Collect livrables for context
    livrables = db.query(Livrable).filter(Livrable.dossier_id == dossier.id).all()
    livrables_summary = "\n".join(
        f"- {liv.type_livrable} (v{liv.version}, {liv.statut}): {liv.chemin_fichier}"
        for liv in livrables
    )

    journal_entries = db.query(Journal).filter(Journal.dossier_id == dossier.id).all()
    journal_summary = "\n".join(
        f"- [{j.created_at.date() if j.created_at else 'N/A'}] {j.agent}: {j.action}"
        for j in journal_entries
    )

    dossier_context = (
        f"Porteur: {dossier.porteur_slug}\n"
        f"Dispositif: {dossier.dispositif}\n"
        f"Projet: {dossier.nom_projet}\n"
        f"Statut: {dossier.statut}\n"
        f"Étape: {dossier.etape_courante}/7\n\n"
        f"## Livrables\n{livrables_summary}\n\n"
        f"## Journal\n{journal_summary}"
    )

    client = get_anthropic_client()
    try:
        message = client.messages.create(
            model=MODEL_OPUS,
            max_tokens=4096,
            system=ARCHIVISTE_SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"## Dossier à archiver\n\n{dossier_context}\n\n"
                        f"Génère le rapport de pilotage pour la période **{payload.periode}**."
                    ),
                }
            ],
        )
    except Exception as exc:
        logger.error("Anthropic API error: %s", exc)
        raise HTTPException(status_code=502, detail=f"Erreur agent Archiviste: {exc}") from exc

    md_content = message.content[0].text
    today = date.today()

    dossier_slug = f"{dossier.porteur_slug}-{dossier.dispositif}"

    # Write rapport
    rapport_path = get_rapport_path(payload.periode, dossier_slug)
    rapport_path.write_text(md_content, encoding="utf-8")

    # Create archive directory and index
    archive_dir = get_archive_path(dossier_slug)
    index_path = archive_dir / "00-index-audit.md"
    if not index_path.exists():
        conservation_year = today.year + 10
        index_content = (
            f"---\n"
            f"porteur: {dossier.porteur_slug}\n"
            f"dossier: {dossier_slug}\n"
            f"agent: archiviste\n"
            f"date_debut: {dossier.created_at.date() if dossier.created_at else today}\n"
            f"date_limite_conservation: {conservation_year}-12-31\n"
            f"statut_final: EN-COURS\n"
            f"---\n\n"
            f"# Index d'audit — {dossier.nom_projet[:100]}\n\n"
            f"## Livrables\n{livrables_summary}\n\n"
            f"## Journal\n{journal_summary}\n"
        )
        index_path.write_text(index_content, encoding="utf-8")

    # Persist livrable
    livrable = Livrable(
        dossier_id=dossier.id,
        porteur_slug=dossier.porteur_slug,
        agent="archiviste",
        type_livrable=f"rapport-{payload.periode}",
        chemin_fichier=str(rapport_path),
        contenu=md_content[:5000],
        version=1,
        statut="brouillon",
        metadata={"periode": payload.periode},
    )
    db.add(livrable)

    dossier.statut = "archivage"
    dossier.etape_courante = 7

    db.add(Journal(
        dossier_id=dossier.id,
        porteur_slug=dossier.porteur_slug,
        agent="archiviste",
        action=f"Rapport {payload.periode} généré + index audit créé",
        details=f"Rapport: {rapport_path.name} | Archive: {archive_dir}",
        version_apres=1,
    ))
    db.commit()
    db.refresh(livrable)

    return ArchivePreuveResponse(
        dossier_id=dossier.id,
        periode=payload.periode,
        chemin_rapport=str(rapport_path),
        chemin_archive=str(archive_dir),
        livrable_id=livrable.id,
    )
