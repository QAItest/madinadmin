# Prompt Cocoon-AI - Diagramme d'architecture Madin'Admin

Utilise le style du generateur Cocoon-AI `architecture-diagram-generator` pour creer un diagramme d'architecture professionnel, sombre, en HTML autonome avec SVG inline, cartes de synthese et export PNG/PDF.

## Titre

Madin'Admin - Architecture interne plateforme aides permanentes

## Objectif du diagramme

Representer l'architecture cible et actuelle de Madin'Admin, une plateforme d'acces aux aides publiques et para-publiques pour les territoires ultramarins. Le produit se concentre sur deux parcours permanents : subventions FEDER et aides Agir Plus.

## Principes visuels

- Theme sombre professionnel.
- Code couleur semantique :
  - Cyan : interface utilisateur et frontend.
  - Emeraude : API, workflows et services applicatifs.
  - Violet : donnees, fichiers et stockage.
  - Ambre : fournisseurs externes et plateformes SaaS.
  - Rose : securite, conformite, erreurs et supervision.
- Montrer les flux principaux avec des fleches lisibles.
- Grouper les composants par domaine.
- Eviter les secrets, cles API et details sensibles.

## Composants a afficher

### 1. Utilisateurs

- Porteur de projet.
- Menage ou professionnel energie.
- Administrateur / equipe back-office.

### 2. Frontend Next.js

- App Next.js + React + TypeScript + Tailwind.
- Pages publiques et connectees :
  - `/aides`
  - `/demarches`
  - `/dispositifs`
  - `/mon-dossier`
  - `/admin`
- Composants :
  - `AuthGate`
  - `MadinDashboard`
  - `MadinLogoMark`
  - `HeaderActionsContext`
- UI :
  - dark/light mode
  - header responsive
  - recherche globale
  - toasts ephemeres bases sur les statuts HTTP
  - parcours FEDER / Agir Plus

### 3. API routes Next.js

- `/api/porteurs`
- `/api/workflow/run`
- `/api/diagnostics/run`
- `/api/dossiers/build`
- `/api/conformite/check`
- `/api/admin/model-route`
- `/api/auth/[...all]`

### 4. Backend / orchestration metier

- Agents de traitement :
  - Diagnostic
  - Montage dossier
  - Checklist pieces
  - Controle conformite
  - Suivi
  - Archivage
- Pipeline :
  - diagnostic
  - preparation des pieces
  - verification conformite
  - generation livrables
  - preuve et archivage
  - suivi des echeances
- Modules metier :
  - FEDER
  - Madin'Energie / Agir Plus
  - compliance dossier
  - notifications statut

### 5. Routage modeles par agent

- `lib/model-routing.ts`
- Selection par agent :
  - modele principal
  - modele de relecture
  - backup open-source
  - effort de raisonnement
- Fournisseurs :
  - OpenAI pour generation principale
  - Anthropic pour relecture / controle
  - Hugging Face pour backup open-source
- Telemetrie admin :
  - token input/output
  - latence
  - cout estime
  - taux de succes
  - fallback
  - dossiers prets / en attente
  - completion par agent

### 6. Donnees et stockage

- Stockage local version developpement :
  - `.data/model-overrides.json`
  - `porteurs/`
  - `diagnostics/`
  - `dossiers/`
  - `controles/`
  - `suivi/`
  - `archives/`
  - `rapports/`
- Cible production :
  - Supabase comme base de donnees
  - Upstash Redis pour cache / rate limit / jobs courts
  - stockage fichiers pour pieces justificatives, preuves et exports

### 7. Services externes prevus

- Better Auth : authentification.
- Vercel : deploiement.
- Stripe : paiement.
- Namecheap : domaine.
- Resend : emails transactionnels.
- Plausible : analytics respectueux de la vie privee.
- PostHog : experimentation et analytics produit.
- Sentry : error tracking.
- Supabase : base de donnees.
- Upstash : Redis.

### 8. Conformite et securite

- Aucune cle API dans le repo.
- `.env` et `.env.local` ignores.
- Journalisation des runs agents.
- Separation espace utilisateur / espace admin.
- Notifications par statut HTTP :
  - 2xx succes
  - 1xx/3xx information
  - 4xx avertissement utilisateur
  - 5xx erreur serveur
- Archivage des preuves, factures, devis, attestations et pieces administratives.

## Flux principaux a representer

1. L'utilisateur s'authentifie puis choisit FEDER ou Agir Plus.
2. Le frontend appelle les API routes Next.js.
3. Les API routes declenchent le workflow metier.
4. Le workflow appelle les agents specialises.
5. Les agents utilisent le routeur de modeles.
6. Le routeur utilise OpenAI, Anthropic ou Hugging Face selon la configuration admin.
7. Les livrables et metriques sont stockes.
8. L'administrateur consulte les KPI, ajuste les modeles par agent et suit les dossiers.
9. Les notifications remontent l'etat des operations via les statuts HTTP.

## Cartes de synthese attendues

- Parcours : FEDER + Agir Plus, avec dossier unique et suivi.
- Pilotage : panel admin avec KPI agents, cout, latence, tokens et fallback.
- Production : auth, donnees, paiements, mails, analytics, observabilite et cache.

## Sortie attendue

Un fichier HTML autonome, responsive, avec diagramme SVG clair, fond sombre, fleches etiquetees, legende couleur, cartes de synthese et footer indiquant "Madin'Admin - documentation interne".
