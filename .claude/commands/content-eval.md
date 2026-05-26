# Commande /content-eval

**Usage** : `/content-eval {porteur} {dossier} [--section {nom}] [--target {score}]`

**Source** : adapté de [ai-marketing-skills/content-ops](https://github.com/ericosiu/ai-marketing-skills)

## Description

Panel d'experts automatique pour évaluer la qualité rédactionnelle et la conformité d'une section de dossier FEDER/FSE+. Assemble 7-10 experts thématiques, score le contenu, et itère jusqu'à atteindre le seuil cible (défaut : 85/100) ou 3 tours maximum.

## Paramètres

- `{porteur}` : Slug du porteur
- `{dossier}` : Identifiant du dossier
- `--section {nom}` : Section ciblée (ex: `03-theorie-changement`, `07-indicateurs`). Si absent : évaluer tout le dossier.
- `--target {score}` : Score cible (défaut : 85)

## Panel d'experts (auto-assemblé selon le contenu)

Experts toujours présents :
- **Expert conformité FEDER** (poids x1.5) : Vérification critères réglementaires, obligations publicité UE
- **Expert cohérence interne** (poids x1.5) : Cohérence entre sections, totaux budgétaires, dates

Experts sélectionnés selon la section évaluée :
| Section | Experts supplémentaires |
|---------|------------------------|
| Budget (04) | Expert financier, Expert aide d'État |
| Indicateurs (07) | Expert RBM/logique d'intervention, Expert SMART |
| Théorie du changement (03) | Expert impact territorial, Expert inclusion sociale |
| Description projet (01) | Expert rédaction administrative, Expert pertinence territoriale |
| Plan financement (09) | Expert cofinancement, Expert taux RUP |
| Toutes sections | Expert lisibilité, Expert densité informationnelle |

## Grilles de notation

### Grille standard (tous types de sections)

| Critère | Poids | Description |
|---------|-------|-------------|
| Conformité réglementaire | 25% | Respect critères FEDER/FSE+, obligations publicité UE |
| Cohérence interne | 20% | Cohérence avec les autres sections du dossier |
| Précision & complétude | 20% | Données chiffrées présentes, pas de "DONNÉE MANQUANTE" |
| Clarté rédactionnelle | 15% | Lisibilité pour une autorité de gestion |
| Impact territorial | 10% | Pertinence pour Martinique/Guadeloupe |
| Absence de risques bloquants | 10% | Pas d'éléments susceptibles de générer un item rouge |

## Workflow d'évaluation

### Tour 1 — Évaluation initiale
1. Lire la section cible + le rapport de conformité existant (si disponible)
2. Assembler le panel d'experts selon le type de section
3. Chaque expert note de 0-100 avec justification et top 3 points faibles
4. Calculer le score agrégé (pondéré)

### Tours 2-3 — Amélioration itérative (si score < cible)
5. Identifier les 3 points faibles prioritaires
6. Proposer des améliorations concrètes (formulations suggérées, données manquantes à remplir)
7. Appliquer les améliorations sur la section (agent Monteur)
8. Réévaluer avec le panel complet
9. Arrêter si score ≥ cible ou après 3 tours

### Sortie de la boucle
10. Afficher la progression des scores (tour 1 → tour final)
11. Si score < cible après 3 tours : lister les blocages et recommander `/deep-dive`

## Règles

- Score cible minimum recommandé : 85/100 pour dépôt
- Score < 70 après 3 tours → recommander `/deep-dive` avant de continuer
- Jamais écraser la version précédente sans incrémenter le champ `version` du frontmatter
- Les suggestions de l'expert conformité FEDER sont prioritaires sur les autres

## Affichage terminal

```
============================================
  ÉVALUATION CONTENU — {section}
============================================
Tour 1 : [XX]/100 ████████░░ [statut]
Tour 2 : [XX]/100 █████████░ [statut]
Tour 3 : [XX]/100 ██████████ VALIDÉ ✓

Points améliorés :
  1. [point]
  2. [point]
  3. [point]

Points résiduels (si score < cible) :
  1. [point] → recommandation

Section mise à jour : dossiers/{dossier}/sections/{section}.md (v{n})
============================================
```

## Exemple

```
/content-eval tpe-durand-sarl 2025-01-15-tpe-durand-feder-axe2 --section 07-indicateurs --target 90
```

## Sortie attendue

- Section mise à jour avec version incrémentée
- Rapport d'évaluation : `dossiers/{dossier}/eval-{section}-{date}.md`
- Score final + détail par expert + liste des améliorations apportées
- Prochaine étape : `/controle` si score ≥ 85 sur toutes les sections
