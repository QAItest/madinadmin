#!/usr/bin/env python3
"""Madin'Admin Multi-Agent Platform — Launcher"""


def main():
    print("=" * 60)
    print("  Madin'Admin — Plateforme Multi-Agents FEDER/FSE+")
    print("  Martinique & Guadeloupe")
    print("=" * 60)
    print()
    print("Démarrage de la plateforme :")
    print()
    print("  1. Démarrer la base de données PostgreSQL :")
    print("     docker compose up -d")
    print()
    print("  2. Démarrer le backend FastAPI (port 8000) :")
    print("     cd backend && uvicorn main:app --reload")
    print("     Documentation API : http://localhost:8000/docs")
    print()
    print("  3. Démarrer le dashboard Next.js (port 3000) :")
    print("     cd madin-admin-platform && npm install && npm run dev")
    print("     Dashboard : http://localhost:3000")
    print()
    print("  4. Lancer Claude Code comme orchestrateur :")
    print("     claude")
    print("     (Claude Code lit CLAUDE.md et orchestre les 9 agents)")
    print()
    print("Agents disponibles :")
    agents = [
        ("Diagnostiqueur", "claude-opus-4-7",   "Éligibilité & cadrage"),
        ("Monteur",        "claude-sonnet-4-5", "Rédaction du dossier"),
        ("Documentaliste", "claude-sonnet-4-5", "Pièces justificatives"),
        ("Contrôleur",     "claude-opus-4-7",   "Audit de conformité"),
        ("Suiveur",        "claude-sonnet-4-5", "Suivi post-dépôt"),
        ("Archiviste",     "claude-opus-4-7",   "Reporting & archivage"),
        ("Veilleur",       "claude-opus-4-7",   "Veille appels à projets"),
        ("OCR",            "claude-sonnet-4-5", "Extraction documents"),
        ("Courrier",       "claude-sonnet-4-5", "Rédaction courriers"),
    ]
    for name, model, role in agents:
        print(f"  - {name:<16} [{model}]  {role}")
    print()
    print("Slash commands Claude Code :")
    commands = [
        ("/diagnostic",   "{porteur} {description}"),
        ("/dossier-feder", "{porteur} {dispositif}"),
        ("/checklist",    "{porteur} {dossier}"),
        ("/controle",     "{porteur} {dossier}"),
        ("/suivi",        "{porteur} {dossier}"),
        ("/archive",      "{porteur} {dossier} {periode}"),
    ]
    for cmd, usage in commands:
        print(f"  {cmd:<20} {usage}")
    print()
    print("Variables d'environnement requises dans .env :")
    print("  ANTHROPIC_API_KEY=sk-ant-...")
    print("  DATABASE_URL=postgresql://madin:madinpass@localhost:5432/madin_admin")
    print()


if __name__ == "__main__":
    main()
