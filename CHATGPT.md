# Madin'Admin Multi-Agent pour ChatGPT/OpenAI

## Mission

Orchestrer une chaine administrative IA avec ChatGPT/OpenAI pour aider les porteurs de projets en Martinique et Guadeloupe a preparer, controler, suivre et archiver des dossiers FEDER, FSE+, autres dispositifs publics et aides a la transition energetique.

L'orchestrateur ChatGPT route les travaux vers les agents specialises. Il consolide les livrables, maintient l'etat du dossier et ne depose jamais a la place du porteur.

## Modules

- Financement de projet : FEDER, FSE+, Region, collectivites, appels a projets et subventions publiques.
- Madin'Energie : aides EDF Agir Plus, economies d'energie, equipements performants, renovation, climatisation, solaire, isolation et accompagnement des particuliers ou professionnels.

## Modeles recommandes et routage

- Orchestrateur : `OPENAI_MODEL_ORCHESTRATOR`, modele de raisonnement fort.
- Agents rapides : `OPENAI_MODEL_SPEED`, `ANTHROPIC_MODEL_SPEED`.
- Agents equilibres : `OPENAI_MODEL_BALANCED`, `ANTHROPIC_MODEL_BALANCED`.
- Agents d'audit : `OPENAI_MODEL_AUDIT`, `ANTHROPIC_MODEL_AUDIT`.
- Agents premium : `OPENAI_MODEL_PREMIUM`, `ANTHROPIC_MODEL_PREMIUM`.
- Backup open-source : `HUGGINGFACE_API_KEY` ou `OPEN_SOURCE_API_KEY`.
- Endpoint compatible Hugging Face / OpenAI : `OPEN_SOURCE_BASE_URL`.
- OCR et extraction : utiliser un modele multimodal ou un fournisseur OCR dedie selon les pieces.

Les noms exacts sont configures par variables d'environnement afin de pouvoir changer de modele sans modifier les prompts.

Routage qualite / temps / gain :

- Diagnostiqueur : audit, effort standard, priorite qualite pour eviter une mauvaise orientation.
- Monteur : equilibre, effort standard, bon rapport volume redactionnel / cout.
- Documentaliste : rapide, effort bas, gain temps maximal sur checklist et pieces.
- Controleur : premium, effort eleve, priorite qualite sur conformite et risques.
- Suiveur : rapide, effort bas, suivi operationnel et relances.
- Archiviste : equilibre, effort standard, precision suffisante pour tracabilite et preuves.

Chaque agent peut etre force individuellement :

- `OPENAI_MODEL_DIAGNOSTIQUEUR`, `ANTHROPIC_MODEL_DIAGNOSTIQUEUR`
- `OPENAI_MODEL_MONTEUR`, `ANTHROPIC_MODEL_MONTEUR`
- `OPENAI_MODEL_DOCUMENTALISTE`, `ANTHROPIC_MODEL_DOCUMENTALISTE`
- `OPENAI_MODEL_CONTROLEUR`, `ANTHROPIC_MODEL_CONTROLEUR`
- `OPENAI_MODEL_SUIVEUR`, `ANTHROPIC_MODEL_SUIVEUR`
- `OPENAI_MODEL_ARCHIVISTE`, `ANTHROPIC_MODEL_ARCHIVISTE`

Backup open-source recommande :

- `OPEN_SOURCE_MODEL_DIAGNOSTIQUEUR=Qwen/Qwen3-30B-A3B-Instruct-2507`
- `OPEN_SOURCE_MODEL_MONTEUR=Qwen/Qwen3-30B-A3B-Instruct-2507`
- `OPEN_SOURCE_MODEL_DOCUMENTALISTE=mistralai/Mistral-Small-3.2-24B-Instruct-2506`
- `OPEN_SOURCE_MODEL_CONTROLEUR=meta-llama/Llama-3.3-70B-Instruct`
- `OPEN_SOURCE_MODEL_SUIVEUR=mistralai/Mistral-Small-3.2-24B-Instruct-2506`
- `OPEN_SOURCE_MODEL_ARCHIVISTE=meta-llama/Llama-3.3-70B-Instruct`

Ordre de secours :

1. Generation principale OpenAI.
2. Backup open-source Hugging Face si OpenAI echoue ou n'est pas configure.
3. Erreur journalisee si aucun modele distant ne produit de livrable.
4. Relecture Anthropic.
5. Relecture open-source si Anthropic echoue.

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
- Monteur : redaction du dossier ou simulation prudente du parcours d'aide.
- Documentaliste : pieces justificatives et checklist.
- Controleur : conformite, audit pre-depot ou controle prime energie.
- Suiveur : post-depot, echeances, travaux et versement.
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
