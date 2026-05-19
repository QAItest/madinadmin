# Madin'Admin Multi-Agent pour ChatGPT/OpenAI

## Mission

Orchestrer une chaine administrative IA avec ChatGPT/OpenAI pour aider les porteurs de projets en Martinique et Guadeloupe a preparer, controler, suivre et archiver des dossiers FEDER, FSE+ et autres dispositifs publics.

L'orchestrateur ChatGPT route les travaux vers les agents specialises. Il consolide les livrables, maintient l'etat du dossier et ne depose jamais a la place du porteur.

## Modeles OpenAI recommandes

- Orchestrateur : `OPENAI_MODEL_ORCHESTRATOR`, modele de raisonnement fort.
- Agents de production : `OPENAI_MODEL_AGENT`, modele rapide pour redaction et suivi.
- Controleur et Archiviste : `OPENAI_MODEL_AUDIT`, modele de raisonnement fort pour audit, coherence et tracabilite.
- OCR et extraction : utiliser un modele multimodal ou un fournisseur OCR dedie selon les pieces.

Les noms exacts sont configures par variables d'environnement afin de pouvoir changer de modele sans modifier les prompts.

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

- Diagnostiqueur : eligibilite et cadrage.
- Monteur : redaction du dossier.
- Documentaliste : pieces justificatives et checklist.
- Controleur : conformite et audit pre-depot.
- Suiveur : post-depot, echeances et journal.
- Archiviste : reporting et dossier de preuve.
- Veilleur : appels a projets.
- OCR : extraction de pieces.
- Courrier : reponses administratives.

## Interdictions absolues

- Pas de chiffre invente.
- Pas de depot automatique.
- Pas de signature pour le porteur.
- Pas de validation si une alerte rouge existe.
- Pas de croisement de donnees entre porteurs.