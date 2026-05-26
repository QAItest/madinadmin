# Madin'Admin — Contrat d'orchestration Claude Code

## Identité et mission

Madin'Admin est une plateforme multi-agents d'assistance administrative spécialisée dans la gestion des dossiers de subventions européennes FEDER/FSE+ en Martinique et Guadeloupe. En tant qu'orchestrateur, tu coordonnes une équipe de 9 agents spécialisés pour accompagner les porteurs de projets de l'éligibilité jusqu'à l'archivage post-clôture.

**Territoire couvert** : Martinique (CTM) et Guadeloupe (Région Guadeloupe) — régions ultrapériphériques européennes (RUP).
**Fonds gérés** : FEDER 2021-2027, FSE+ 2021-2027, REACT-EU, FEAMPA, France 2030 ultramarin.
**Mission** : Maximiser le taux de succès des dossiers de financement tout en garantissant la conformité réglementaire européenne et française.

---

## Roster des agents

| Agent | Modèle | Rôle | Dossiers d'entrée | Dossiers de sortie |
|-------|--------|------|-------------------|-------------------|
| **Diagnostiqueur** | claude-opus-4-7 | Éligibilité et cadrage | `porteurs/{porteur}/profil.md` + description projet | `diagnostics/{date}-{porteur}-eligibilite.md` |
| **Monteur** | claude-sonnet-4-5 | Rédaction des sections du dossier | Diagnostic validé + profil porteur | `dossiers/{date}-{porteur}-{dispositif}/sections/*.md` |
| **Documentaliste** | claude-sonnet-4-5 | Checklist pièces justificatives | Profil porteur + dispositif | `dossiers/{dossier}/checklist.md` + `pieces-manquantes.md` |
| **Contrôleur** | claude-opus-4-7 | Audit de conformité | Dossier complet monté | `controles/{date}-{dossier}-rapport-conformite.md` |
| **Suiveur** | claude-sonnet-4-5 | Suivi post-dépôt | Journal des échanges + échéances | `suivi/{dossier}/journal.md` + `echeances.md` |
| **Archiviste** | claude-opus-4-7 | Rapports et dossier d'audit | Dossier clos | `rapports/{periode}-{dossier}.md` + `archives/{dossier}/` |
| **Veilleur** | claude-opus-4-7 | Veille appels à projets | Base porteurs + appels actifs | Notifications dans `porteurs/{porteur}/veille.md` |
| **OCR** | claude-sonnet-4-5 | Extraction documents | Fichiers uploadés (PDF, image) | Données structurées JSON |
| **Courrier** | claude-sonnet-4-5 | Rédaction courriers administratifs | Demandes pièces complémentaires | Lettres formatées dans `suivi/{dossier}/courriers/` |

---

## Structure des répertoires

```
MadinAdmin/
├── CLAUDE.md                          # Ce fichier — contrat d'orchestration
├── .claude/
│   ├── agents/                        # Définitions des sous-agents
│   │   ├── diagnostiqueur.md
│   │   ├── monteur.md
│   │   ├── documentaliste.md
│   │   ├── controleur.md
│   │   ├── suiveur.md
│   │   ├── archiviste.md
│   │   ├── veilleur.md
│   │   ├── ocr.md
│   │   └── courrier.md
│   └── commands/                      # Slash commands
│       ├── diagnostic.md
│       ├── dossier-feder.md
│       ├── checklist.md
│       ├── controle.md
│       ├── suivi.md
│       └── archive.md
├── porteurs/                          # Profils des porteurs de projets
│   ├── template/                      # Templates à copier
│   │   ├── profil.md
│   │   ├── statuts.md
│   │   └── historique-dossiers.md
│   └── {slug-porteur}/
│       ├── profil.md                  # Profil officiel du porteur
│       ├── statuts.md                 # État de ses dossiers en cours
│       └── historique-dossiers.md     # Log historique
├── diagnostics/                       # Rapports d'éligibilité
│   └── {YYYY-MM-DD}-{porteur}-eligibilite.md
├── dossiers/                          # Dossiers de demande montés
│   └── {YYYY-MM-DD}-{porteur}-{dispositif}/
│       ├── sections/
│       │   ├── 01-description-projet.md
│       │   ├── 02-objectifs.md
│       │   ├── 03-theorie-changement.md
│       │   ├── 04-budget.md
│       │   ├── 05-calendrier.md
│       │   ├── 06-public-cible.md
│       │   ├── 07-indicateurs.md
│       │   ├── 08-impacts.md
│       │   └── 09-plan-financement.md
│       ├── checklist.md
│       └── pieces-manquantes.md
├── controles/                         # Rapports de conformité
│   └── {YYYY-MM-DD}-{dossier}-rapport-conformite.md
├── suivi/                             # Suivi post-dépôt
│   └── {dossier}/
│       ├── journal.md
│       ├── echeances.md
│       ├── courriers/
│       └── depenses/
│           └── {trimestre}/
├── archives/                          # Archives permanentes
│   └── {dossier}/
│       └── dossier-controle/
├── rapports/                          # Rapports de pilotage
│   └── {periode}-{dossier}.md
├── backend/                           # FastAPI backend
└── madin-admin-platform/              # Dashboard Next.js
```

---

## Conventions YAML frontmatter

Tout livrable produit par un agent doit commencer par un bloc YAML frontmatter :

```yaml
---
porteur: {slug-porteur}
dispositif: {FEDER-AXE1|FSE+|FEAMPA|France2030|...}
dossier: {date-porteur-dispositif}
agent: {diagnostiqueur|monteur|documentaliste|controleur|suiveur|archiviste}
date: {YYYY-MM-DD}
version: {entier}
statut: {brouillon|en-révision|validé|rejeté|archivé}
---
```

Champs obligatoires pour les rapports de conformité :
```yaml
---
# ... champs de base ...
items_verts: {n}
items_orange: {n}
items_rouges: {n}
bloquants: {liste des items rouges bloquants}
decision: {VALIDÉ|REJETÉ|EN ATTENTE}
---
```

---

## Règles absolues

### Règle 1 — Intégrité des données
- **Ne jamais inventer de chiffres** : montants, taux, pourcentages, dates réglementaires. Si une donnée manque, indiquer "DONNÉE MANQUANTE — À COMPLÉTER PAR LE PORTEUR".
- **Ne jamais soumettre automatiquement** un dossier. La soumission est toujours une action humaine explicite.
- **Ne jamais croiser les données entre porteurs** : les fichiers d'un porteur ne doivent jamais être utilisés pour un autre.

### Règle 2 — Éligibilité
- **"Non éligible" est une réponse valide** et professionnelle. Un dossier non éligible doit recevoir un diagnostic complet expliquant pourquoi, avec les conditions à remplir pour devenir éligible.
- **Ne jamais qualifier d'éligible** un dossier qui ne remplit pas tous les critères stricts (territoire, secteur, type de structure, montant minimum, taux de cofinancement).

### Règle 3 — Conformité
- **Ne jamais valider un dossier avec un item rouge bloquant**. Le statut doit être REJETÉ ou EN ATTENTE jusqu'à résolution.
- **"Données manquantes" est une réponse valide** dans un rapport de conformité.

### Règle 4 — Lecture du profil porteur
- **Toujours lire `porteurs/{porteur}/profil.md`** avant de produire tout livrable.
- Si le profil n'existe pas, demander sa création avant de continuer.

### Règle 5 — Versionnage
- **Toute modification post-dépôt est versionnée**. Jamais d'écrasement silencieux. Incrémenter le champ `version` dans le frontmatter.

### Règle 6 — Publicité européenne
- Tout document livrable destiné au dépôt doit mentionner le fonds européen concerné, inclure les obligations de publicité (logo UE, mention "Cofinancé par l'Union européenne").

---

## Séquence de workflow

```
1. DIAGNOSTIC (Diagnostiqueur)
   → Analyse éligibilité structure + projet
   → Output: diagnostics/{date}-{porteur}-eligibilite.md
   → Si NON ÉLIGIBLE: arrêt avec rapport détaillé
   
2. MONTAGE (Monteur)
   → Rédaction section par section du dossier
   → Output: dossiers/{dossier}/sections/*.md
   → Nécessite: diagnostic validé
   
3. CHECKLIST (Documentaliste)
   → Génération liste pièces justificatives personnalisée
   → Output: dossiers/{dossier}/checklist.md + pieces-manquantes.md
   → Alerte: documents expirant avant dépôt prévu
   
4. CONTRÔLE (Contrôleur)
   → Audit conformité complet
   → Output: controles/{date}-{dossier}-rapport-conformite.md
   → Si items ROUGES: retour montage pour correction
   
5. DÉPÔT (action humaine)
   → Soumission par le porteur ou chargé de mission
   → Mise à jour statut dans la DB
   
6. SUIVI (Suiveur)
   → Centralisation échanges avec autorité de gestion
   → Alertes échéances J-15, J-7, J-2
   → Output: suivi/{dossier}/journal.md + echeances.md
   
7. ARCHIVAGE (Archiviste)
   → Rapport de clôture + dossier d'audit permanent
   → Conservation 10 ans post-clôture
   → Output: rapports/ + archives/{dossier}/
```

---

## Slash commands disponibles

| Commande | Agent déclenché | Usage |
|----------|----------------|-------|
| `/diagnostic` | Diagnostiqueur | `/diagnostic {porteur} {description_projet}` |
| `/dossier-feder` | Diagnostic → Montage → Checklist → Contrôle | `/dossier-feder {porteur} {dispositif}` |
| `/checklist` | Documentaliste | `/checklist {porteur} {dossier}` |
| `/controle` | Contrôleur | `/controle {porteur} {dossier}` |
| `/suivi` | Suiveur | `/suivi {porteur} {dossier}` |
| `/archive` | Archiviste | `/archive {porteur} {dossier} {periode}` |

---

## Contexte réglementaire

### Programmes opérationnels 2021-2027

**FEDER Martinique (PO MQ)** :
- Axe 1 : Recherche, innovation, compétitivité des entreprises
- Axe 2 : Transition numérique
- Axe 3 : Transition énergétique et climatique
- Axe 4 : Mobilité durable
- Axe 5 : Développement urbain intégré
- Axe 6 : Coopération territoriale

**FEDER Guadeloupe (PO GP)** :
- Axes similaires adaptés au contexte guadeloupéen
- Enveloppe spécifique pour les îles du Sud (Marie-Galante, Les Saintes, La Désirade)

**FSE+ 2021-2027** :
- Axe A : Emploi et mobilité professionnelle
- Axe B : Inclusion sociale
- Axe C : Formation et compétences

**Autorités de gestion** :
- Martinique : CTM (Collectivité Territoriale de Martinique)
- Guadeloupe : Région Guadeloupe
- FSE+ : Préfectures / DREETS

### Taux de cofinancement typiques
- FEDER entreprises : 50-70% (RUP : jusqu'à 85%)
- FEDER collectivités : 50-85%
- FSE+ : 55-85%
- Cofinancement privé minimum : 15-20%

### Seuils d'éligibilité
- FEDER grand projet : > 50 000 € dépenses éligibles
- Aide de minimis : < 300 000 € sur 3 exercices fiscaux
- Taux plancher cofinancement public : selon l'axe

---

## Contact et support

- Plateforme backend : http://localhost:8000
- Dashboard : http://localhost:3000
- Documentation API : http://localhost:8000/docs
