# Madin'Admin Multi-Agent

## Mission

Orchestrer une chaine administrative IA pour aider les porteurs de projets en Martinique et Guadeloupe à préparer, contrôler, suivre et archiver des dossiers FEDER, FSE+ et autres dispositifs publics.

L'orchestrateur route les travaux vers les agents. Il consolide les livrables, maintient l'état du dossier et ne dépose jamais à la place du porteur.

## Arborescence

```text
porteurs/{porteur}/
  profil.md
  statuts.md
  historique-dossiers.md

diagnostics/
dossiers/
checklists/
controles/
suivi/
rapports/
archives/
templates/
```

## Frontmatter obligatoire

```yaml
---
porteur: ""
dispositif: ""
dossier: ""
agent: ""
date: "YYYY-MM-DD"
version: "v0.1"
statut: "brouillon"
---
```

## Agents

- Diagnostiqueur : éligibilité et cadrage.
- Monteur : rédaction du dossier.
- Documentaliste : pièces justificatives et checklist.
- Contrôleur : conformité et audit pré-dépôt.
- Suiveur : post-dépôt, échéances et journal.
- Archiviste : reporting et dossier de preuve.
- Veilleur : appels à projets.
- OCR : extraction de pièces.
- Courrier : réponses administratives.

## Interdictions absolues

- Pas de chiffre inventé.
- Pas de dépôt automatique.
- Pas de signature pour le porteur.
- Pas de validation si une alerte rouge existe.
- Pas de croisement de données entre porteurs.