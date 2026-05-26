# Madin'Admin

Plateforme multi-agent d'assistance administrative pour le montage, la conformite, le suivi et l'archivage de dossiers FEDER, FSE+, dispositifs publics ultramarins et aides a la transition energetique.

## Etat fusionne

Ce depot contient maintenant deux couches issues de deux historiques Git fusionnes :

- **Racine du depot** : MVP Next.js local inspire de `madin-admin-mvp.jsx`, adapte a ChatGPT/OpenAI, avec stockage fichier local et fallback sans cle API.
- **Architecture distante ajoutee par `origin/master`** : orchestration Claude Code, backend FastAPI/PostgreSQL, dashboard Next.js separe dans `madin-admin-platform/`, documentation et screenshots SVG.

## MVP local a la racine

### Demarrage

```bash
npm install
npm run dev
```

Ouvrir ensuite `http://localhost:3000`.

### Fonctionnalites

- Creation d'un porteur.
- Choix du module : financement de projet ou Madin'Energie.
- Timeline des 6 agents : Diagnostiqueur, Monteur, Documentaliste, Controleur, Suiveur, Archiviste.
- Generation de livrables Markdown versionnes.
- Journal de progression et visualisation du livrable.
- Mode OpenAI si `OPENAI_API_KEY` est renseignee.
- Mode fallback local si aucune cle API n'est configuree.

### Module Madin'Energie

Madin'Energie guide les menages, entreprises, collectivites, bailleurs et partenaires locaux sur les aides a la maitrise de l'energie, notamment les parcours EDF Agir Plus a verifier au cas par cas.

Le module couvre :

- diagnostic energetique simple du logement, local ou batiment ;
- identification des aides energie applicables ;
- simulation prudente de prime et d'economies, sans montant invente ;
- checklist des factures, devis, fiches techniques, attestations et preuves ;
- suivi des travaux, du depot justificatif et du versement ;
- archivage des factures, devis, attestations et elements de preuve.

## Architecture distante ajoutee

### Orchestration Claude Code

- `CLAUDE.md`
- `.claude/agents/*.md`
- `.claude/commands/*.md`

Agents inclus : Diagnostiqueur, Monteur, Documentaliste, Controleur, Suiveur, Archiviste, Veilleur, OCR, Courrier.

### Backend FastAPI

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

API : `http://localhost:8000`

### PostgreSQL et pgAdmin

```bash
docker compose up -d
```

- PostgreSQL : `localhost:5432`
- pgAdmin : `http://localhost:5050`

### Dashboard distant

```bash
cd madin-admin-platform
npm install
npm run dev
```

## Variables d'environnement

Copier `.env.example` vers `.env`, puis renseigner les cles utiles selon le mode utilise :

- `OPENAI_API_KEY` pour le MVP local ChatGPT/OpenAI.
- `ANTHROPIC_API_KEY` pour l'architecture Claude/Anthropic.
- `DATABASE_URL` pour le backend PostgreSQL.

## Regles bloquantes

- Ne jamais inventer de chiffres, criteres, dates, financements ou pieces.
- Ne jamais deposer automatiquement a la place du porteur.
- Ne jamais signer ou engager juridiquement le porteur.
- Chaque livrable doit contenir le frontmatter YAML obligatoire.
- Cloisonnement strict des donnees par porteur.
