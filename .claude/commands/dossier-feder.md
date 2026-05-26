# Commande /dossier-feder

**Usage** : `/dossier-feder {porteur} {dispositif}`

## Description

Lance la chaîne complète de montage d'un dossier FEDER : diagnostic → montage → checklist → contrôle. C'est la commande principale pour créer un dossier complet de demande de subvention.

## Paramètres

- `{porteur}` : Slug identifiant unique du porteur
- `{dispositif}` : Identifiant du dispositif (ex: `feder-axe2-numerique`, `feder-axe1-innovation`, `fse-plus-emploi`)

## Séquence d'exécution

### Phase 1 — Pré-vérification (orchestrateur)
1. Vérifier existence de `porteurs/{porteur}/profil.md`
2. Vérifier existence d'un diagnostic `ELIGIBLE` ou `ELIGIBLE-SOUS-CONDITIONS` dans `diagnostics/`
3. Si diagnostic absent → lancer `/diagnostic` en premier

### Phase 2 — Montage (agent monteur)
4. Déléguer au Monteur pour rédiger les 9 sections du dossier
5. Créer `dossiers/{date}-{porteur}-{dispositif}/sections/`
6. Rédiger section par section (01 à 09)
7. Signaler à l'utilisateur quand chaque section est complète

### Phase 3 — Checklist (agent documentaliste)
8. Déléguer au Documentaliste pour générer la checklist personnalisée
9. Créer `dossiers/{dossier}/checklist.md` et `pieces-manquantes.md`
10. Alerter sur les pièces expirantes

### Phase 4 — Contrôle (agent contrôleur)
11. Déléguer au Contrôleur pour l'audit de conformité
12. Créer `controles/{date}-{dossier}-rapport-conformite.md`
13. Si items ROUGES → retourner au Monteur pour correction + relancer le contrôle
14. Si VALIDÉ → annoncer le dossier prêt pour dépôt

## Règles

- **Ne jamais sauter l'étape de contrôle** même si l'utilisateur le demande
- **Ne jamais déposer automatiquement** — le dépôt est toujours une action humaine
- En cas d'items rouges : présenter clairement les corrections à apporter avant toute relance
- Conserver tous les brouillons intermédiaires avec versionnage (v1, v2, etc.)

## Exemple

```
/dossier-feder tpe-durand-sarl feder-axe2-numerique
```

## Sortie attendue

- `dossiers/{date}-{porteur}-{dispositif}/sections/*.md` (9 sections)
- `dossiers/{dossier}/checklist.md`
- `dossiers/{dossier}/pieces-manquantes.md`
- `controles/{date}-{dossier}-rapport-conformite.md`
- Résumé final : statut conformité + liste pièces manquantes + prochaines étapes