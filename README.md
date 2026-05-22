# Madin'Admin — Plateforme Multi-Agent FEDER/FSE+

**Plateforme IA d'assistance administrative pour le montage, la conformité et le suivi des dossiers FEDER, FSE+ et dispositifs publics ultramarins — Martinique & Guadeloupe.**

---

![Dashboard Madin'Admin](docs/screenshots/dashboard.svg)

---

## Vue d'ensemble

Madin'Admin est une chaîne de 9 agents IA spécialisés orchestrée par Claude Code. Chaque étape du montage de dossier a un agent dédié, chaque livrable est versionné avec un frontmatter YAML auditable, chaque décision est traçable jusqu'au contrôle sur pièces.

| | |
|---|---|
| **Territoire** | Martinique & Guadeloupe |
| **Dispositifs** | FEDER, FSE+, REACT-EU, FEAMPA, France 2030 ultramarin, CTM, Région Guadeloupe, ADEME |
| **Orchestrateur** | Claude Code (Opus 4.7, 1M context) |
| **Agents métier** | 6 agents spécialisés (Diagnostiqueur, Monteur, Documentaliste, Contrôleur, Suiveur, Archiviste) |
| **Agents support** | 3 agents (Veilleur, OCR, Courrier) |
| **Backend** | FastAPI · Python · PostgreSQL (Docker) |
| **Dashboard** | Next.js 16 · Anthropic AI SDK · Tailwind CSS |

---

## Architecture

```
Claude Code (Opus 4.7)
        ORCHESTRATEUR
    ↓      ↓      ↓      ↓      ↓      ↓
 OPUS   SONNET  SONNET   OPUS  SONNET   OPUS
Diagno  Monteur  Docu   Contr  Suiveur  Archi
stique          mentaliste ôleur        viste
    ↓      ↓      ↓      ↓      ↓      ↓
diagno  dossi  check  contr  suivi/  archi
stics/ ers/   lists/ oles/          ves/
```

**Principe directeur** : l'orchestrateur ne rédige jamais le dossier lui-même et ne dépose jamais à la place du porteur. Il route, consolide, enchaîne. Chaque livrable a un auteur unique, identifié dans son frontmatter YAML avec horodatage et version.

---

## Workflow FEDER end-to-end

![Workflow Stepper](docs/screenshots/workflow-stepper.svg)

| Étape | Agent | Délai | Sortie |
|---|---|---|---|
| 1 · Diagnostic | Diagnostiqueur (Opus) | J-60 | `diagnostics/{date}-{porteur}-eligibilite.md` |
| 2 · Montage | Monteur (Sonnet) | J-45 | `dossiers/{date}-{porteur}-{dispositif}/sections/*.md` |
| 3 · Checklist | Documentaliste (Sonnet) | J-30 | `dossiers/{dossier}/checklist.md` + `pieces-manquantes.md` |
| 4 · Contrôle | Contrôleur (Opus) | J-10 | `controles/{date}-{dossier}-rapport-conformite.md` |
| 5 · Dépôt | Suiveur (Sonnet) | J+0 | `suivi/{dossier}/journal.md` · `echeances.md` |
| 6 · Suivi | Suiveur (Sonnet) | J+0→J+90 | `depenses/{trimestre}/` |
| 7 · Archivage | Archiviste (Opus) | J+90 | `rapports/{periode}-{dossier}.md` · `dossier-controle.pdf` |

---

## Les agents

![Roster des agents](docs/screenshots/agents-roster.svg)

### Agents métier

| Agent | Modèle | Mission | Règle critique |
|---|---|---|---|
| **Diagnostiqueur** | Opus 4.7 | Analyse éligibilité (structure, secteur, territoire, budget, calendrier). Croise avec la matrice des dispositifs ouverts en Martinique & Guadeloupe. | "Non éligible" est une réponse valide — refuse de qualifier éligible un dossier qui ne coche pas tous les critères durs. |
| **Monteur** | Sonnet 4.6 | Rédige section par section : description projet, objectifs, théorie du changement, budget, calendrier, indicateurs, impacts, plan de financement. | Chaque indicateur doit être SMART et raccordé au PO régional. Pas d'indicateur "à définir". |
| **Documentaliste** | Sonnet 4.6 | Génère la checklist personnalisée de pièces justificatives. Met à jour à chaque pièce reçue. | Signale les pièces dont la validité expire avant la date de dépôt et déclenche une demande de renouvellement. |
| **Contrôleur** | Opus 4.7 | Audit de conformité complet : cohérence inter-sections, totaux budgétaires, taux cofinancement, obligations publicité européenne. | Ne valide JAMAIS un dossier avec un bloquant rouge. "Donnée manquante" est une réponse valide. |
| **Suiveur** | Sonnet 4.6 | Centralise les échanges post-dépôt avec les autorités de gestion. Alerte 15/7/2 jours avant chaque échéance critique. | Chaque modification post-dépôt est versionnée et historisée. Pas d'écrasement silencieux. |
| **Archiviste** | Opus 4.7 | Génère rapports d'avancement, synthèses COPIL, tableaux de bord financiers, dossier de preuve permanent. | Conservation 10 ans après clôture (durée légale fonds européens). |

### Agents support

| Agent | Modèle | Mission |
|---|---|---|
| **Veilleur** | Opus 4.7 | Surveille les nouveaux appels à projets (FEDER, France 2030, régionaux) et notifie quand un dispositif matche un porteur en base. |
| **OCR** | Sonnet 4.6 | Extrait les données structurées des pièces uploadées (K-bis, factures, RIB, attestations) pour préremplir le dossier. |
| **Courrier** | Sonnet 4.6 | Rédige les réponses aux demandes de pièces complémentaires dans le registre administratif attendu. |

---

## Visualiseur de livrables

![Livrable Viewer](docs/screenshots/livrable-viewer.svg)

Chaque livrable produit par un agent est affiché avec son frontmatter YAML complet (porteur, dispositif, dossier, agent, date, version, statut) et son contenu markdown rendu. Export PDF en un clic via Puppeteer.

---

## Stack technique

| Brique | Rôle | Détail |
|---|---|---|
| **Claude Code** | Orchestrateur | Lit `CLAUDE.md`, route vers les sous-agents, consolide les livrables |
| **Sous-agents** | 9 agents métier + support | Définis dans `.claude/agents/*.md` — Opus 4.7 / Sonnet 4.6 |
| **Slash commands** | Raccourcis utilisateur | `/diagnostic` `/dossier-feder` `/checklist` `/controle` `/suivi` `/archive` |
| **Dashboard Next.js** | Interface porteur | Next.js 16 · App Router · React 19 · Tailwind · Anthropic AI SDK |
| **Backend FastAPI** | API & persistance | FastAPI · SQLAlchemy · PostgreSQL · port 8000 |
| **Base de données** | PostgreSQL 16 | Docker · tables : porteurs, dossiers, livrables, echeances, journal |
| **Export PDF** | Puppeteer headless | Rapports et dossiers de preuve en PDF A4 |
| **Mémoire porteur** | Fichiers profil | `porteurs/{porteur}/profil.md` · `statuts.md` · `historique-dossiers.md` |

### Convention critique

Chaque livrable a un **frontmatter YAML obligatoire** :

```yaml
---
porteur: asso-culture-mtq
dispositif: FEDER-axe-5.1
dossier: 2026-05-15-asso-culture-mtq-feder
agent: diagnostiqueur
date: 2026-05-15
version: 1
statut: validé
---
```

Cloisonnement `porteurs/{porteur}/` strict — aucun agent ne croise les données entre porteurs.

---

## Installation

### Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/)
- [Python 3.11+](https://www.python.org/)
- [Claude Code CLI](https://claude.ai/code)
- Clé API Anthropic

### 1. Cloner le projet

```bash
git clone https://github.com/QAItest/madinadmin.git
cd madinadmin
```

### 2. Variables d'environnement

```bash
cp .env.example .env
# Éditer .env et renseigner ANTHROPIC_API_KEY
```

```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://madin:madinpass@localhost:5432/madin_admin
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 3. Base de données (Docker)

```bash
docker compose up -d
# PostgreSQL → localhost:5432
# pgAdmin    → http://localhost:5050  (admin@madin.local / adminpass)
```

### 4. Backend FastAPI

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# API  → http://localhost:8000
# Docs → http://localhost:8000/docs
```

### 5. Dashboard Next.js

```bash
cd madin-admin-platform
npm install
npm run dev
# Dashboard → http://localhost:3000
```

### 6. Orchestrateur Claude Code

```bash
# À la racine du projet
claude
# Claude Code lit CLAUDE.md et orchestre les 9 agents
```

---

## Utilisation — Slash commands

### `/diagnostic {porteur} {description}`

Lance le Diagnostiqueur sur un nouveau porteur.

```
/diagnostic asso-culture-mtq "Projet de transition numérique d'une association culturelle martiniquaise, budget 180 000€, démarrage septembre 2026"
```

**Livrable :** `diagnostics/2026-05-21-asso-culture-mtq-eligibilite.md`

---

### `/dossier-feder {porteur} {dispositif}`

Déclenche le workflow complet : diagnostic → montage → checklist → contrôle.

```
/dossier-feder asso-culture-mtq FEDER-axe-5.1
```

**Livrables :**
- `diagnostics/` — éligibilité argumentée
- `dossiers/` — sections rédigées (25-30 pages)
- `checklists/` — liste personnalisée des pièces
- `controles/` — rapport de conformité (vert/orange/rouge)

---

### `/checklist {porteur} {dossier}`

Génère ou met à jour la checklist des pièces justificatives.

```
/checklist asso-culture-mtq 2026-05-21-asso-culture-mtq-feder
```

---

### `/controle {porteur} {dossier}`

Audit de conformité complet avant dépôt.

```
/controle asso-culture-mtq 2026-05-21-asso-culture-mtq-feder
```

**Rapport :** statut par item (🟢 vert / 🟡 orange / 🔴 rouge) + plan de remédiation pour chaque alerte.

---

### `/suivi {porteur} {dossier}`

Mise à jour post-dépôt : échéances, journal d'échanges, justificatifs de dépenses.

```
/suivi asso-culture-mtq 2026-05-21-asso-culture-mtq-feder
```

---

### `/archive {porteur} {dossier} {periode}`

Génère le rapport d'avancement et le dossier de preuve.

```
/archive asso-culture-mtq 2026-05-21-asso-culture-mtq-feder S1-2026
```

**Livrable :** `archives/{dossier}/dossier-controle.pdf` — prêt pour contrôle sur place ou sur pièces.

---

## API Backend

Documentation interactive : **http://localhost:8000/docs**

| Endpoint | Description |
|---|---|
| `POST /api/diagnostics/run` | Projet → diagnostic d'éligibilité |
| `POST /api/dossiers/build` | Diagnostic → dossier section par section |
| `GET /api/dossiers/` | Liste tous les dossiers |
| `GET /api/dossiers/{id}` | Détail dossier + livrables |
| `POST /api/conformite/check` | Dossier complet → rapport de conformité |
| `POST /api/pieces/ocr` | Upload pièce → extraction structurée |
| `POST /api/archives/preuve` | Dossier → package contrôle |

---

## Structure du projet

```
madinadmin/
├── CLAUDE.md                         # Contrat orchestrateur
├── docker-compose.yml                # PostgreSQL + pgAdmin
├── .env.example
├── main.py                           # Guide de démarrage
│
├── .claude/
│   ├── agents/                       # 9 définitions d'agents
│   │   ├── diagnostiqueur.md         # Opus 4.7
│   │   ├── monteur.md                # Sonnet 4.6
│   │   ├── documentaliste.md         # Sonnet 4.6
│   │   ├── controleur.md             # Opus 4.7
│   │   ├── suiveur.md                # Sonnet 4.6
│   │   ├── archiviste.md             # Opus 4.7
│   │   ├── veilleur.md               # Opus 4.7
│   │   ├── ocr.md                    # Sonnet 4.6
│   │   └── courrier.md               # Sonnet 4.6
│   └── commands/                     # 6 slash commands
│       ├── diagnostic.md
│       ├── dossier-feder.md
│       ├── checklist.md
│       ├── controle.md
│       ├── suivi.md
│       └── archive.md
│
├── backend/                          # FastAPI
│   ├── main.py
│   ├── _common.py
│   ├── database.py
│   ├── models.py
│   ├── requirements.txt
│   ├── sql/init.sql
│   └── api/
│       ├── diagnostics.py
│       ├── dossiers.py
│       ├── conformite.py
│       ├── pieces.py
│       └── archives.py
│
├── madin-admin-platform/             # Next.js 16
│   ├── app/
│   │   ├── page.tsx                  # Dashboard
│   │   ├── porteurs/[porteur]/       # Vue porteur
│   │   ├── dossiers/[dossier]/       # Vue dossier
│   │   └── api/                      # Proxy → FastAPI
│   └── components/
│       ├── WorkflowStepper.tsx
│       ├── DossierCard.tsx
│       ├── LiverableViewer.tsx
│       └── AgentBadge.tsx
│
├── porteurs/{porteur}/               # Mémoire porteur
│   ├── profil.md
│   ├── statuts.md
│   └── historique-dossiers.md
│
├── diagnostics/                      # Livrables Diagnostiqueur
├── dossiers/                         # Livrables Monteur
├── checklists/                       # Livrables Documentaliste
├── controles/                        # Livrables Contrôleur
├── suivi/                            # Livrables Suiveur
├── rapports/                         # Livrables Archiviste
└── archives/                         # Dossiers de preuve
```

---

## Règles absolues

Ces règles sont bloquantes pour tous les agents — elles ne peuvent pas être contournées par l'utilisateur.

1. **Pas de chiffre inventé** — Toute donnée chiffrée doit être fournie par le porteur ou extraite d'un document sourcé.
2. **Pas de dépôt automatique** — L'orchestrateur ne dépose jamais à la place du porteur.
3. **Pas de signature à la place du porteur** — Aucun agent ne signe.
4. **Lecture du profil obligatoire** — Chaque agent lit `porteurs/{porteur}/profil.md` avant de produire.
5. **Cloisonnement porteur strict** — Aucun agent ne croise les données entre porteurs.
6. **Bloquant rouge = arrêt** — Le Contrôleur ne valide jamais un dossier avec un bloquant rouge.

---

## Économie unitaire (estimations)

| Livrable | Agent | Coût indicatif |
|---|---|---|
| Diagnostic d'éligibilité complet | Diagnostiqueur (Opus) | ~1,80 € |
| Montage dossier FEDER 25-30 pages | Monteur (Sonnet) | ~4,50 € |
| Checklist personnalisée + OCR pièces | Documentaliste + OCR | ~2,20 € |
| Rapport de conformité pré-dépôt | Contrôleur (Opus) | ~8,00 € |
| Suivi mensuel (échéances + journal) | Suiveur (Sonnet) | ~3,50 € |
| Dossier de preuve + rapport annuel | Archiviste (Opus) | ~6,00 € |
| **Dossier FEDER complet** | **Tous agents** | **~35 €** |

*Coûts API Anthropic uniquement, hors OCR tiers, hors hébergement, hors temps humain.*

---

## Licence

Usage interne — Madin'Admin · Martinique & Guadeloupe · Assistance administrative IA
