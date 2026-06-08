# Madin'Admin

Plateforme multi-agent d'assistance administrative pour le montage, la conformite, le suivi et l'archivage de dossiers FEDER, FSE+, dispositifs publics ultramarins et aides a la transition energetique.

## Etat fusionne

Ce depot contient deux couches issues de deux historiques Git fusionnes :

- **Racine du depot** : MVP Next.js local inspire de `madin-admin-mvp.jsx`, adapte a ChatGPT/OpenAI, avec stockage fichier local et fallback sans cle API.
- **Architecture distante** : orchestration Claude Code, backend FastAPI/PostgreSQL, dashboard Next.js separe dans `madin-admin-platform/`, documentation et screenshots SVG.

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

## Orchestration Claude Code

- `CLAUDE.md`
- `.claude/agents/*.md`
- `.claude/commands/*.md`

Agents inclus : Diagnostiqueur, Monteur, Documentaliste, Controleur, Suiveur, Archiviste, Veilleur, OCR, Courrier.

### Modeles par composant

Affectation des modeles Claude telle que choisie dans le projet (non alignee volontairement entre sous-agents et backend) :

| Agent | Sous-agent (`.claude/agents/`) | Backend (`backend/_common.py`) |
|---|---|---|
| Diagnostiqueur | `claude-opus-4-7` | `claude-opus-4-5` |
| Controleur | `claude-opus-4-7` | `claude-opus-4-5` |
| Archiviste | `claude-opus-4-7` | `claude-opus-4-5` |
| Veilleur | `claude-opus-4-7` | `claude-opus-4-5` |
| Monteur | `claude-sonnet-4-5` | `claude-sonnet-4-5` |
| Documentaliste | `claude-sonnet-4-5` | `claude-sonnet-4-5` |
| Suiveur | `claude-sonnet-4-5` | `claude-sonnet-4-5` |
| OCR | `claude-sonnet-4-5` | `claude-sonnet-4-5` |
| Courrier | `claude-sonnet-4-5` | `claude-sonnet-4-5` |

Les sous-agents, `CLAUDE.md`, `main.py` et le dashboard (`page.tsx`) utilisent `claude-opus-4-7` pour les agents Opus ; le backend FastAPI appelle `claude-opus-4-5` (constante `MODEL_OPUS`). Les agents Sonnet utilisent `claude-sonnet-4-5` partout (constante `MODEL_SONNET`).

Commandes coeur de metier :

- `/diagnostic`
- `/dossier-feder`
- `/checklist`
- `/controle`
- `/suivi`
- `/archive`

Commandes ajoutees par le remote :

- `/porteur-research`
- `/porteur-prospect`
- `/porteur-dossier`
- `/plan`
- `/deep-dive`
- `/autoresearch`
- `/content-eval`

## Backend FastAPI

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

API : `http://localhost:8000`

## PostgreSQL et pgAdmin

```bash
docker compose up -d
```

- PostgreSQL : `localhost:5432`
- pgAdmin : `http://localhost:5050`

## Dashboard distant

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

## Stack SaaS cible

Madin'Admin est prepare pour une stack SaaS complete :

- **Supabase** : base de donnees principale pour les porteurs, dossiers, pieces, droits et evenements.
- **Better Auth** : authentification applicative via `app/api/auth/[...all]/route.ts`.
- **Vercel** : deploiement Next.js, environnements preview/production et gestion des secrets.
- **Stripe** : paiement, abonnements, portail client et webhooks.
- **Namecheap** : domaine et DNS, a pointer vers Vercel.
- **Resend** : mails transactionnels, notifications dossier et rappels.
- **Plausible** : analytics sobre via script conditionnel.
- **PostHog** : A/B testing, feature flags et product analytics.
- **Sentry** : error tracking client/serveur.
- **Upstash Redis** : cache, rate limiting, verrous et files legeres.

Les SDK sont installes, mais les services restent inactifs tant que les variables correspondantes ne sont pas renseignees. Les clients sont centralises dans `lib/integrations.ts`; l'auth Better Auth est declaree dans `lib/auth.ts`; Plausible et PostHog sont branches via `components/AnalyticsScripts.tsx`.

## Regles bloquantes

- Ne jamais inventer de chiffres, criteres, dates, financements, montants de prime ou pieces.
- Ne jamais deposer automatiquement a la place du porteur.
- Ne jamais signer ou engager juridiquement le porteur.
- Chaque livrable doit contenir le frontmatter YAML obligatoire.
- Cloisonnement strict des donnees par porteur.
- Pour Madin'Energie, verifier les fiches d'offres EDF Agir Plus avant toute conclusion d'eligibilite ou de montant.

## Documentation

Toute la documentation redactionnelle est regroupee dans `docs/` :

- `docs/besoins/madin-energie.md` : cadrage du module Madin'Energie.
- `docs/design-system/madinadmin/MASTER.md` : design system (charte, composants).
- `docs/design-system/madinadmin/pages/dashboard.md` : specification de la page dashboard.
- `docs/internal/architecture/` : diagrammes et prompt d'architecture interne.
- `docs/google-stitch.md` : note d'integration Google Stitch.
- `docs/screenshots/` : captures SVG utilisees dans ce README.

Les fichiers de configuration des outils restent a leur emplacement attendu : `CLAUDE.md` et `CHATGPT.md` a la racine, definitions d'agents et commandes dans `.claude/`, `.chatgpt/` et `.codex/`.
