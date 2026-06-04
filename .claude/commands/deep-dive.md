# Commande /deep-dive

**Usage** : `/deep-dive {porteur} {dossier} {problème}`

**Source** : adapté de [oh-my-claudecode/skills/deep-dive](https://github.com/Yeachan-Heo/oh-my-claudecode)

## Description

Orchestre une investigation approfondie en deux temps :
1. **Analyse causale parallèle** (3 hypothèses simultanées) sur le problème signalé
2. **Recueil structuré des besoins** (questions Socratiques) alimenté par les résultats de l'analyse

Utile quand un dossier a des items rouges inexpliqués, des incohérences budgétaires, ou une décision de rejet non comprise.

## Paramètres

- `{porteur}` : Slug du porteur
- `{dossier}` : Identifiant du dossier
- `{problème}` : Description du problème (ex: "items rouges sur taux cofinancement", "rejet AG sans explication claire")

## Séquence d'exécution

### Phase 1 — Initialisation
1. Lire `porteurs/{porteur}/profil.md`, `dossiers/{dossier}/sections/*.md`, `controles/*-rapport-conformite.md`
2. Générer 3 hypothèses causales distinctes
3. Présenter les 3 hypothèses à l'utilisateur pour confirmation ou ajustement

### Phase 2 — Analyse parallèle (3 lanes)
4. Lancer 3 sous-agents simultanés, chacun sur une hypothèse :
   - Lane A : Analyse technique (budget, calculs, taux)
   - Lane B : Analyse réglementaire (critères FEDER/FSE+, obligations publicité UE)
   - Lane C : Analyse des artefacts (incohérences entre sections, données manquantes)
5. Chaque lane produit : preuves pour/contre, inconnues critiques, sondes recommandées
6. Sauvegarder dans `.omc/specs/deep-dive-trace-{dossier}.md`

### Phase 3 — Interview structuré
7. Injecter les résultats des 3 lanes comme contexte de départ
8. Poser les questions issues des inconnues critiques (1 question à la fois)
9. Arrêter quand les causes racines sont confirmées

### Phase 4 — Plan d'action
10. Proposer les corrections à apporter (section par section)
11. Recommander la commande suivante : `/autoresearch` ou `/controle`

## Règles

- Ne jamais implémenter les corrections directement — présenter le plan et attendre validation
- Si les 3 lanes sont contradictoires : afficher toutes les hypothèses et laisser l'utilisateur trancher
- Ne pas relancer le contrôle sans résolution des causes identifiées

## Exemple

```
/deep-dive tpe-durand-sarl 2025-01-15-tpe-durand-feder-axe2 "rapport de conformité rouge sur indicateurs de résultats et taux cofinancement"
```

## Sortie attendue

- `.omc/specs/deep-dive-trace-{dossier}.md`
- Liste ordonnée des causes racines identifiées
- Plan de correction par section avec priorités
- Prochaine étape recommandée
