# Madin'Admin Platform

Plateforme multi-agent administrative adaptee a ChatGPT/OpenAI pour le montage, la conformite, le suivi et l'archivage de dossiers FEDER, FSE+ et dispositifs publics ultramarins.

## Objectif

Le projet organise une chaine auditable d'agents specialises autour de livrables Markdown versionnes : diagnostic, montage du dossier, checklist documentaire, controle de conformite, suivi post-depot et archivage.

## Stack prevue

- Dashboard web : Next.js 16, React, AI SDK OpenAI, gray-matter, generation PDF via Puppeteer.
- Backend : FastAPI pour les integrations e-Synergie, Demarches-Simplifiees, OCR et signature.
- Agents : fichiers `.chatgpt/agents/*.md` et commandes `.chatgpt/commands/*.md`.
- Memoire porteur : fichiers Markdown dans `porteurs/{porteur}/`.

## Demarrage

```bash
npm install
npm run dev
```

Ouvrir ensuite `http://localhost:3000`.

## Fonctionnalites implementees

- Creation d'un porteur avec memoire locale dans `porteurs/{porteur}/`.
- Dashboard de suivi des 6 etapes : diagnostic, montage, checklist, controle, suivi, archivage.
- Generation de livrables Markdown versionnes dans les dossiers metier.
- Enchainement sequentiel : une etape devient disponible apres production de la precedente.
- Routes API Next.js pour creer les porteurs et lancer les agents.
- Mode fallback local sans cle API, utile pour tester le workflow.
- Mode OpenAI actif automatiquement quand `OPENAI_API_KEY` est renseignee.

API Python :

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```

## Configuration OpenAI

Copier `.env.example` vers `.env.local`, puis renseigner :

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL_ORCHESTRATOR=gpt-5.2
OPENAI_MODEL_AGENT=gpt-5.4-mini
OPENAI_MODEL_AUDIT=gpt-5.2
```

## Regles bloquantes

- Ne jamais inventer de chiffres, criteres, dates, financements ou pieces.
- Ne jamais deposer un dossier automatiquement a la place du porteur.
- Ne jamais signer ou engager juridiquement le porteur.
- Chaque livrable doit contenir le frontmatter YAML obligatoire.
- Cloisonnement strict des donnees par porteur.
