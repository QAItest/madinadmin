# Commande /plan

**Usage** : `/plan {porteur} {objectif} [--direct] [--consensus]`

**Source** : adapté de [oh-my-claudecode/skills/plan](https://github.com/Yeachan-Heo/oh-my-claudecode)

## Description

Planification stratégique du travail sur un dossier ou une mission administrative. Trois modes disponibles :
- **Interview** (défaut) : Pour les demandes vagues — pose des questions ciblées pour clarifier le scope
- **Direct** (`--direct`) : Pour les demandes précises — génère immédiatement le plan
- **Consensus** (`--consensus`) : Pour les décisions à fort enjeu — boucle Planificateur / Architecte / Critique

## Paramètres

- `{porteur}` : Slug du porteur
- `{objectif}` : Description de l'objectif (ex: "préparer le dossier FSE+ emploi en 3 semaines")
- `--direct` : Planification immédiate sans questions
- `--consensus` : Validation multi-perspectives (recommandé pour dossiers > 200 000 €)

## Séquence d'exécution

### Mode Interview (défaut)
1. Lire `porteurs/{porteur}/profil.md` et l'historique des dossiers
2. Poser 1 question ciblée à la fois (jamais plusieurs d'un coup)
3. Arrêter quand le scope est suffisamment clair
4. Générer le plan et attendre validation avant toute action

### Mode Direct (`--direct`)
1. Lire le profil porteur et les artefacts existants
2. Générer immédiatement un plan structuré avec jalons, agents impliqués, livrables
3. Marquer le plan `en attente d'approbation`

### Mode Consensus (`--consensus`) — pour dossiers à fort enjeu
1. **Planificateur** : Rédige le plan initial + au moins 2 options d'approche
2. **Architecte** : Revoit la solidité du plan + contre-argument de devil's advocate
3. **Critique** : Évalue la qualité — critères : 80%+ des affirmations citent des fichiers/règles précises, 90%+ des critères d'acceptation sont testables
4. Boucle de révision (max 5 tours) si rejeté
5. Ajouter une section ADR (Décision / Facteurs / Alternatives / Justification / Conséquences)
6. Validation finale par l'utilisateur

## Critères de qualité du plan

- Chaque étape cite l'agent responsable et le livrable attendu
- Les délais sont absolus (date), pas relatifs ("dans 3 jours")
- Tous les risques ont une mitigation
- Pas de métriques vagues ("qualité" → "score conformité ≥ 85/100")

## Règles

- **Ne jamais exécuter** avant approbation explicite de l'utilisateur
- En mode Consensus : l'Architecte s'exécute avant le Critique (séquentiel, pas parallèle)
- Sur approbation : recommander `/dossier-feder` ou la commande adaptée

## Exemple

```
/plan association-sport-guadeloupe "monter dossier FEDER axe 3 en 6 semaines, budget prévisionnel 180 000 €" --consensus
```

## Sortie attendue

- Plan structuré avec phases, agents, livrables, jalons et dates
- En mode Consensus : section ADR + historique des révisions
- Prochaine commande recommandée pour démarrer l'exécution
