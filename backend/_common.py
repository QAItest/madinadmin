"""Shared utilities for Madin'Admin backend."""
from __future__ import annotations

import os
from datetime import date
from functools import lru_cache
from pathlib import Path

import anthropic
from pydantic_settings import BaseSettings


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

class Settings(BaseSettings):
    anthropic_api_key: str = ""
    database_url: str = "postgresql://madin:madinpass@localhost:5432/madin_admin"
    backend_url: str = "http://localhost:8000"

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()


# ---------------------------------------------------------------------------
# Root paths
# ---------------------------------------------------------------------------

ROOT_DIR = Path(__file__).parent.parent  # C:\Users\g.prospa\Documents\MadinAdmin


def get_diagnostics_dir() -> Path:
    p = ROOT_DIR / "diagnostics"
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_dossiers_dir() -> Path:
    p = ROOT_DIR / "dossiers"
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_controles_dir() -> Path:
    p = ROOT_DIR / "controles"
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_suivi_dir() -> Path:
    p = ROOT_DIR / "suivi"
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_archives_dir() -> Path:
    p = ROOT_DIR / "archives"
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_rapports_dir() -> Path:
    p = ROOT_DIR / "rapports"
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_porteur_dir(porteur_slug: str) -> Path:
    p = ROOT_DIR / "porteurs" / porteur_slug
    p.mkdir(parents=True, exist_ok=True)
    return p


# ---------------------------------------------------------------------------
# Path builders
# ---------------------------------------------------------------------------

def get_diagnostic_path(porteur_slug: str, today: date | None = None) -> Path:
    d = today or date.today()
    filename = f"{d.isoformat()}-{porteur_slug}-eligibilite.md"
    return get_diagnostics_dir() / filename


def get_dossier_path(porteur_slug: str, dispositif: str, today: date | None = None) -> Path:
    d = today or date.today()
    folder_name = f"{d.isoformat()}-{porteur_slug}-{dispositif}"
    path = get_dossiers_dir() / folder_name
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_controle_path(dossier_slug: str, today: date | None = None) -> Path:
    d = today or date.today()
    filename = f"{d.isoformat()}-{dossier_slug}-rapport-conformite.md"
    return get_controles_dir() / filename


def get_suivi_path(dossier_slug: str) -> Path:
    p = get_suivi_dir() / dossier_slug
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_archive_path(dossier_slug: str) -> Path:
    p = get_archives_dir() / dossier_slug
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_rapport_path(periode: str, dossier_slug: str) -> Path:
    filename = f"{periode}-{dossier_slug}.md"
    return get_rapports_dir() / filename


# ---------------------------------------------------------------------------
# YAML frontmatter generator
# ---------------------------------------------------------------------------

def build_frontmatter(
    porteur: str,
    dispositif: str,
    dossier: str,
    agent: str,
    statut: str = "brouillon",
    version: int = 1,
    extra: dict | None = None,
) -> str:
    """Generate YAML frontmatter block for a Madin'Admin markdown livrable."""
    lines = [
        "---",
        f"porteur: {porteur}",
        f"dispositif: {dispositif}",
        f"dossier: {dossier}",
        f"agent: {agent}",
        f"date: {date.today().isoformat()}",
        f"version: {version}",
        f"statut: {statut}",
    ]
    if extra:
        for key, value in extra.items():
            if isinstance(value, list):
                lines.append(f"{key}:")
                for item in value:
                    lines.append(f"  - {item}")
            else:
                lines.append(f"{key}: {value}")
    lines.append("---")
    return "\n".join(lines) + "\n\n"


# ---------------------------------------------------------------------------
# Anthropic client factory
# ---------------------------------------------------------------------------

def get_anthropic_client() -> anthropic.Anthropic:
    settings = get_settings()
    api_key = settings.anthropic_api_key or os.environ.get("ANTHROPIC_API_KEY", "")
    return anthropic.Anthropic(api_key=api_key)


# ---------------------------------------------------------------------------
# Agent model constants
# ---------------------------------------------------------------------------

MODEL_OPUS = "claude-opus-4-5"      # Diagnostiqueur, Contrôleur, Archiviste, Veilleur
MODEL_SONNET = "claude-sonnet-4-5"  # Monteur, Documentaliste, Suiveur, OCR, Courrier


# ---------------------------------------------------------------------------
# Porteur profile reader
# ---------------------------------------------------------------------------

def read_porteur_profile(porteur_slug: str) -> str | None:
    """Read porteurs/{slug}/profil.md and return its content, or None if missing."""
    path = ROOT_DIR / "porteurs" / porteur_slug / "profil.md"
    if not path.exists():
        return None
    return path.read_text(encoding="utf-8")
