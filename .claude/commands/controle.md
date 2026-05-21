# Commande /controle

**Usage** : `/controle {porteur} {dossier}`

## Description

Lance le Contrôleur pour effectuer un audit de conformité complet sur un dossier monté. Vérifie la cohérence interne, les budgets, les taux de cofinancement, les obligations réglementaires et produit un rapport de conformité avec statut par item.

## Paramètres

- `{porteur}` : Slug du porteur
- `{dossier}` : Identifiant du dossier à auditer

## Séquence d'exécution

1. Vérifier que le dossier existe (`dossiers/{dossier}/sections/`) et est complet (sections 01 à 09)
2. Vérifier que la checklist existe (`dossiers/{dossier}/checklist.md`)
3. Déléguer au Contrôleur l'audit complet (7 modules A à G)
4. Produire `controles/{date}-{dossier}-rapport-conformite.md`
5. Afficher la décision et le résumé des items par niveau

## Règles

- **Ne jamais retourner VALIDÉ** si au moins 1 item est ROUGE BLOQUANT
- En cas de REJETÉ : lister les corrections obligatoires et proposer `/dossier-feder` pour corriger
- En cas de VALIDÉ : confirmer que le dossier est prêt pour dépôt humain (jamais automatique)

## Exemple

```
/controle tpe-durand-sarl 2025-06-15-tpe-durand-feder-axe2
```

## Sortie attendue

- `controles/{date}-{dossier}-rapport-conformite.md`
- Décision : VALIDÉ / REJETÉ / EN ATTENTE
- Tableau : nb items verts / orange / rouges
- Si REJETÉ : liste des corrections obligatoires
