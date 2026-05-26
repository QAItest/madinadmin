# Commande /checklist

**Usage** : `/checklist {porteur} {dossier}`

## Description

Lance le Documentaliste pour générer ou mettre à jour la checklist de pièces justificatives d'un dossier existant. Utile pour vérifier l'état des pièces avant dépôt ou suite à une demande de compléments de l'autorité de gestion.

## Paramètres

- `{porteur}` : Slug du porteur
- `{dossier}` : Identifiant du dossier (ex: `2025-06-15-tpe-durand-feder-axe2`)

## Séquence d'exécution

1. Lire `porteurs/{porteur}/profil.md` pour le type de structure
2. Lire le diagnostic associé pour le dispositif ciblé
3. Lire `dossiers/{dossier}/checklist.md` si existant (mise à jour) ou en créer un nouveau
4. Déléguer au Documentaliste pour générer/mettre à jour la checklist personnalisée
5. Identifier les pièces manquantes et créer/mettre à jour `pieces-manquantes.md`
6. Alerter sur les pièces arrivant à expiration avant la date de dépôt prévue

## Règles

- Incrémenter la version du fichier checklist à chaque mise à jour
- Conserver l'historique des statuts (quand une pièce est passée de MANQUANT à REÇU)
- Si date de dépôt non définie dans le dossier → demander à l'utilisateur

## Exemple

```
/checklist tpe-durand-sarl 2025-06-15-tpe-durand-feder-axe2
```

## Sortie attendue

- `dossiers/{dossier}/checklist.md` (mise à jour avec versionnage)
- `dossiers/{dossier}/pieces-manquantes.md`
- Tableau récapitulatif : X pièces reçues / Y manquantes / Z expirantes
