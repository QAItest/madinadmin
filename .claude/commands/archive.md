# Commande /archive

**Usage** : `/archive {porteur} {dossier} {periode}`

## Description

Lance l'Archiviste pour générer le rapport de pilotage et constituer ou mettre à jour le dossier d'audit permanent pour un dossier et une période donnés.

## Paramètres

- `{porteur}` : Slug du porteur
- `{dossier}` : Identifiant du dossier
- `{periode}` : Période du rapport (ex: `2025-S1`, `2025-annuel`, `final`)

## Séquence d'exécution

1. Collecter tous les fichiers du dossier : sections, checklist, contrôles, journal suivi, dépenses
2. Déléguer à l'Archiviste la génération du rapport de pilotage
3. Produire `rapports/{periode}-{dossier}.md`
4. Mettre à jour ou créer le dossier d'audit dans `archives/{dossier}/`
5. Si `{periode}` = `final` → générer le dossier d'audit complet + timeline décisionnelle

## Règles

- Les archives ne sont **jamais modifiées** une fois créées
- Toute correction fait l'objet d'un addendum (nouveau fichier)
- Vérifier la complétude du dossier avant archivage final
- Pour archivage final : confirmer la date de clôture et calculer `date_limite_conservation` (10 ans)

## Exemple

```
/archive tpe-durand-sarl 2025-06-15-tpe-durand-feder-axe2 2025-S2
```

## Sortie attendue

- `rapports/{periode}-{dossier}.md`
- `archives/{dossier}/00-index-audit.md` (créé ou mis à jour)
- Si `final` : structure complète `archives/{dossier}/` avec toutes les sections (01 à 08)
- Dashboard financier mis à jour : `rapports/dashboard-{porteur}-{YYYY-MM}.md`
