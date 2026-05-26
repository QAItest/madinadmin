# Commande /autoresearch

**Usage** : `/autoresearch {porteur} {dossier} [--section {nom}] [--max-iterations {n}]`

**Source** : adapté de [oh-my-claudecode/skills/autoresearch](https://github.com/Yeachan-Heo/oh-my-claudecode)

## Description

Boucle d'amélioration itérative sur une section de dossier ou sur un rapport de conformité.
À chaque itération, l'agent Monteur (ou Contrôleur) retravaille le contenu, l'évaluateur mesure le score de conformité, et la boucle continue jusqu'à atteindre le seuil ou le nombre max d'itérations.

## Paramètres

- `{porteur}` : Slug du porteur
- `{dossier}` : Identifiant du dossier (ex: `2025-01-15-tpe-durand-feder-axe2`)
- `--section {nom}` : Section ciblée (ex: `04-budget`, `07-indicateurs`). Si absent, travaille sur tout le dossier.
- `--max-iterations {n}` : Nombre max d'itérations (défaut : 5)

## Artefacts persistants

Stockés sous `.omc/autoresearch/{dossier}/` :
```
.omc/autoresearch/{dossier}/
  mission.md              ← objectif de l'itération
  evaluator.json          ← critères d'évaluation FEDER
  runs/{run-id}/
    evaluations/
      iteration-0001.json
      iteration-0002.json
    decision-log.md       ← log lisible des décisions
```

## Séquence d'exécution

1. **Initialisation** : Lire `dossiers/{dossier}/sections/{section}.md` + `controles/*-rapport-conformite.md`
2. **Définir l'évaluateur** : Critères FEDER/FSE+ applicables (taux cofinancement, publicité UE, indicateurs de résultats)
3. **Boucle itérative** :
   - Lancer l'agent Monteur sur la section ciblée
   - Évaluer via l'agent Contrôleur → score JSON `{ "pass": bool, "score": 0-100, "items_rouges": [...] }`
   - Persister le JSON d'évaluation
   - Appender une entrée au `decision-log.md`
   - Si `pass: true` ou `score >= 85` → arrêter
   - Si iterations >= max → arrêter avec rapport final
4. **Rapport final** : Afficher la progression des scores + version finale

## Règles

- Ne jamais écraser les artefacts des itérations précédentes
- Incrémenter `version` dans le frontmatter à chaque itération
- Arrêt immédiat si l'utilisateur tape `/cancel`
- `pass: true` requis sur items rouges bloquants avant validation finale

## Exemple

```
/autoresearch tpe-durand-sarl 2025-01-15-tpe-durand-feder-axe2 --section 04-budget --max-iterations 4
```

## Sortie attendue

- `.omc/autoresearch/{dossier}/runs/{run-id}/decision-log.md`
- Section mise à jour avec version finale
- Rapport de progression : score initial → score final, nombre d'itérations
