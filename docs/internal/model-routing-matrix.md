# Matrice interne de routage des modèles

Cette matrice donne un nom opérateur en français à chaque modèle afin de reconnaître rapidement quel moteur traite, relit ou prend le relais dans Madin'Admin.

## Noms opérateurs

| Nom opérateur | Modèle technique | Fournisseur | Rôle principal | Usage recommandé |
| --- | --- | --- | --- | --- |
| Stratège Grand Format | `gpt-5.5` | OpenAI | Génération premium | Arbitrages complexes, forte incertitude, dossiers sensibles |
| Pilote Polyvalent | `gpt-5.4` | OpenAI | Génération standard | Production quotidienne avec bon équilibre qualité / temps |
| Opérateur Rapide | `gpt-5.4-mini` | OpenAI | Génération rapide | Tâches répétables, checklist, synthèse courte |
| Pilote Standard | `gpt-5.3` | OpenAI | Génération standard | Alternative polyvalente si disponible |
| Auditeur Senior | `gpt-5.2` | OpenAI | Génération audit | Diagnostic, conformité, risques initiaux |
| Raisonneur Expert | `o3` | OpenAI | Raisonnement | Cas nécessitant une analyse logique approfondie |
| Relecteur Éclair | `claude-haiku-4-5` | Anthropic | Relecture rapide | Vérifications simples et faible latence |
| Relecteur Équilibre | `claude-sonnet-4-6` | Anthropic | Relecture standard | Relecture qualité / cohérence au quotidien |
| Relecteur Premium | `claude-opus-4-8` | Anthropic | Relecture renforcée | Contrôle critique, conformité, arbitrages |
| Relecteur Profond | `claude-opus-4-7` | Anthropic | Relecture renforcée | Alternative premium |
| Relecteur Renforcé | `claude-opus-4-6` | Anthropic | Relecture renforcée | Alternative premium |
| Relais Dossier | `Qwen/Qwen3-30B-A3B-Instruct-2507` | Hugging Face | Backup open-source | Relais généraliste structuré |
| Relais Express | `mistralai/Mistral-Small-3.2-24B-Instruct-2506` | Hugging Face | Backup open-source rapide | Relais rapide pour pièces, suivi, tâches courtes |
| Relais Grand Volume | `meta-llama/Llama-3.3-70B-Instruct` | Hugging Face | Backup open-source premium | Relais sur dossiers longs ou contrôle avancé |
| Relais Synthèse | `google/gemma-3-27b-it` | Hugging Face | Backup open-source | Synthèse et reformulation |
| Relais Vision | `Qwen/Qwen3-VL-30B-A3B-Instruct` | Hugging Face | Backup vision | Pièces ou contenus visuels si activé |
| Secours Structuré | `local-structured-fallback` | Application | Dernier recours | Livrable minimal si les services distants sont indisponibles |

## Matrice par agent

| Agent | Nom métier | Moteur principal | Relecture | Relais automatique | Effort | Objectif |
| --- | --- | --- | --- | --- | --- | --- |
| `diagnostiqueur` | Diagnostic | Auditeur Senior | Relecteur Équilibre | Relais Dossier | Standard | Éligibilité, risques, cadrage initial |
| `monteur` | Montage dossier | Opérateur Rapide | Relecteur Équilibre | Relais Dossier | Standard | Rédaction structurée et volumétrie |
| `documentaliste` | Checklist pièces | Stratège Grand Format | Relecteur Premium | Relais Vision | Élevé | Contrôle strict des justificatifs, validité et blocages |
| `controleur` | Contrôle conformité | Stratège Grand Format | Relecteur Premium | Relais Grand Volume | Élevé | Cohérence, conformité, blocages |
| `suiveur` | Suivi post-dépôt | Opérateur Rapide | Relecteur Éclair | Relais Express | Bas | Relances, échéances, suivi |
| `archiviste` | Archivage et preuve | Opérateur Rapide | Relecteur Équilibre | Relais Grand Volume | Standard | Traçabilité, preuve, conservation |

## Lecture opérationnelle

- **Moteur principal** : premier moteur appelé pour produire le livrable.
- **Relais automatique** : moteur appelé si le principal est indisponible ou en erreur.
- **Relecture** : contrôle et amélioration après génération.
- **Secours Structuré** : génération applicative minimale, utilisée seulement si aucun service distant ne répond.

## Règle de maintenance

Quand un modèle technique change dans `.env`, `.data/model-overrides.json` ou le panel admin, vérifier que son nom opérateur reste clair dans `lib/model-routing.ts`.
