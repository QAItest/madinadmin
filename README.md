# Madin'Admin Platform

Plateforme multi-agent administrative pour le montage, la conformité, le suivi et l'archivage de dossiers FEDER, FSE+ et dispositifs publics ultramarins.

## Objectif

Le projet organise une chaine auditable d'agents spécialisés autour de livrables Markdown versionnés : diagnostic, montage du dossier, checklist documentaire, contrôle de conformité, suivi post-dépôt et archivage.

## Stack prévue

- Dashboard web : Next.js 16, React, gray-matter, génération PDF via Puppeteer.
- Backend : FastAPI pour les intégrations e-Synergie, Démarches-Simplifiées, OCR et signature.
- Agents : fichiers `.claude/agents/*.md` et commandes `.claude/commands/*.md`.
- Mémoire porteur : fichiers Markdown dans `porteurs/{porteur}/`.

## Démarrage

```bash
npm install
npm run dev
```

API Python :

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```

## Règles bloquantes

- Ne jamais inventer de chiffres, critères, dates, financements ou pièces.
- Ne jamais déposer un dossier automatiquement à la place du porteur.
- Ne jamais signer ou engager juridiquement le porteur.
- Chaque livrable doit contenir le frontmatter YAML obligatoire.
- Cloisonnement strict des données par porteur.