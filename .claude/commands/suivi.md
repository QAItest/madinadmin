# Commande /suivi

**Usage** : `/suivi {porteur} {dossier}`

## Description

Lance le Suiveur pour mettre à jour le suivi post-dépôt d'un dossier. Enregistre les nouveaux événements, vérifie les échéances actives, génère les alertes et met à jour le journal.

## Paramètres

- `{porteur}` : Slug du porteur
- `{dossier}` : Identifiant du dossier suivi

## Séquence d'exécution

1. Lire `suivi/{dossier}/journal.md` (historique existant)
2. Lire `suivi/{dossier}/echeances.md` (échéances actives)
3. Demander à l'utilisateur les événements récents à enregistrer (échanges AG, documents reçus, pièces envoyées)
4. Déléguer au Suiveur la mise à jour du journal et des échéances
5. Calculer et afficher les alertes actives (J-15, J-7, J-2)
6. Si modification de pièce existante → versionner sans écraser

## Règles

- Toujours versionner les modifications (`version: n+1`)
- Ne jamais écraser une entrée du journal
- Toujours proposer le Courrier si une réponse à l'AG est nécessaire

## Exemple

```
/suivi tpe-durand-sarl 2025-06-15-tpe-durand-feder-axe2
```

## Sortie attendue

- `suivi/{dossier}/journal.md` (mise à jour)
- `suivi/{dossier}/echeances.md` (mise à jour)
- `suivi/{dossier}/alertes.md` si échéances imminentes
- Résumé des alertes actives et prochaines actions
