# Documentation interne d'architecture

Ce dossier sert de point d'entree pour produire et maintenir les diagrammes d'architecture Madin'Admin avec le repo Cocoon-AI `architecture-diagram-generator`.

Source utilisee : https://github.com/Cocoon-AI/architecture-diagram-generator

## Fichiers

- `madin-admin-architecture.prompt.md` : prompt source a coller dans le generateur Cocoon-AI.
- `madin-admin-architecture.html` : diagramme interne HTML autonome, consultable directement dans un navigateur.

## Workflow recommande

1. Ouvrir le repo Cocoon-AI `architecture-diagram-generator` et installer/utiliser le generateur selon son README.
2. Copier le contenu de `madin-admin-architecture.prompt.md`.
3. Generer un diagramme HTML autonome.
4. Exporter en PNG/PDF si besoin pour une presentation interne.
5. Remplacer `madin-admin-architecture.html` ou ajouter une version datee si le diagramme change fortement.

## Regles de documentation

- Ne jamais inclure de cle API, secret, token ou contenu `.env`.
- Montrer les flux fonctionnels, les dependances et les zones de responsabilite.
- Distinguer clairement frontend, API routes, orchestration agents, stockage, services externes et observabilite.
- Garder les libelles compréhensibles par une equipe produit, design, dev et direction.
- Mettre a jour ce dossier apres toute evolution majeure : auth, paiement, analytics, modele de donnees, routage modeles, pipeline agents.

## Perimetre actuel

Madin'Admin couvre deux parcours permanents :

- Subventions FEDER pour les projets structurants.
- Aides Agir Plus pour la transition energetique.

Le diagramme interne couvre aussi :

- Espace utilisateur et espace admin.
- Authentification, dossiers, workflows et notifications.
- Routage des modeles par agent avec sauvegarde open-source.
- Integrations prevues : Supabase, Better Auth, Vercel, Stripe, Namecheap, Resend, Plausible, PostHog, Sentry et Upstash.
