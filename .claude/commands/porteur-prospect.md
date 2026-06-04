# Commande /porteur-prospect

**Usage** : `/porteur-prospect {porteur} [--url {site_web}]`

**Source** : adapté de [ai-sales-team-claude/skills/sales-prospect](https://github.com/zubair-trabzada/ai-sales-team-claude)

## Description

Analyse complète d'un porteur de projet en parallèle : 5 sous-agents simultanés produisent un rapport de score global indiquant le potentiel du porteur à obtenir un financement FEDER/FSE+. Commande de cadrage rapide avant de lancer un diagnostic officiel.

## Paramètres

- `{porteur}` : Slug ou nom de la structure (ex: `association-martinique-numerique`)
- `--url {site_web}` : URL du site de la structure pour extraction automatique (optionnel)

## Phase 1 — Collecte d'information (séquentielle)

1. Lire `porteurs/{porteur}/profil.md` si existant
2. Si `--url` fourni : extraire via WebFetch le contenu public (site, mentions légales, actualités)
3. Classifier le type de structure : Association / TPE-PME / Collectivité / GIP / Établissement public / Autre
4. Identifier le territoire : Martinique / Guadeloupe / Autre
5. Constituer un **briefing de découverte** partagé avec tous les sous-agents

## Phase 2 — Analyse parallèle (5 sous-agents simultanés)

Lancer les 5 sous-agents en parallèle avec le briefing comme contexte commun :

| Sous-agent | Focus | Poids |
|------------|-------|-------|
| `structure-fit` | Type structure, secteur, ancienneté, capacité administrative | 25% |
| `capacite-financiere` | Budget annuel, autofinancement, fonds propres, dettes | 20% |
| `projet-viabilite` | Pertinence du projet, impact territorial, ancrage local | 20% |
| `conformite-preliminaire` | Critères d'éligibilité FEDER/FSE+, exclusions réglementaires | 20% |
| `dispositifs-disponibles` | Appels à projets ouverts, calendriers, taux de cofinancement applicables | 15% |

Chaque sous-agent retourne un score 0-100 avec détail par sous-dimension.

## Phase 3 — Synthèse et score porteur

Calcul du **Score Porteur (0-100)** :
```
Score = structure_fit*0.25 + capacite_financiere*0.20 + projet_viabilite*0.20
      + conformite_preliminaire*0.20 + dispositifs_disponibles*0.15
```

| Score | Grade | Décision recommandée |
|-------|-------|----------------------|
| 80-100 | A — Fort potentiel | Lancer `/diagnostic` immédiatement |
| 60-79 | B — Potentiel conditionnel | Renforcer le profil, puis `/diagnostic` |
| 40-59 | C — Potentiel limité | Travailler les conditions d'éligibilité |
| 0-39 | D — Non recommandé | Diagnostic de refus probable, orienter vers autres financements |

## Sortie — PORTEUR-PROSPECT.md

Générer `porteurs/{porteur}/PORTEUR-PROSPECT.md` avec :
- Score global et grade
- Tableau de détail par dimension
- Top 3 dispositifs recommandés avec taux de cofinancement estimé
- Top 3 points de vigilance
- Plan d'action en 3 horizons (immédiat / 1 mois / 3 mois)

## Affichage terminal

```
============================================
  ANALYSE PORTEUR COMPLÈTE
============================================
Structure : [nom] ([type])
Territoire : [Martinique/Guadeloupe]

Score Porteur : [X]/100 (Grade [A/B/C/D])

Dimensions :
  Structure fit :       [XX]/100 ████████░░
  Capacité financière : [XX]/100 ██████░░░░
  Viabilité projet :    [XX]/100 ███████░░░
  Conformité préliminaire: [XX]/100 █████░░░░░
  Dispositifs dispo :   [XX]/100 ████████░░

Dispositifs recommandés : [liste]
Prochaine étape : [commande]
============================================
```

## Règles

- Ne jamais conclure à l'éligibilité définitive — ce score est indicatif, seul `/diagnostic` est officiel
- Si aucun profil porteur n'existe : créer `porteurs/{porteur}/profil.md` à partir des données collectées
- En cas d'échec d'un sous-agent : score neutre 50, réduire le niveau de confiance global

## Exemple

```
/porteur-prospect association-sport-guadeloupe --url https://asso-sport-gp.fr
```
