# Commande /porteur-research

**Usage** : `/porteur-research {porteur} [--url {site_web}] [--siret {numero}]`

**Source** : adapté de [ai-sales-team-claude/skills/sales-research](https://github.com/zubair-trabzada/ai-sales-team-claude)

## Description

Recherche approfondie sur une structure porteuse : collecte d'informations publiques multi-sources pour construire ou enrichir le profil porteur. Produit une fiche structurée prête à être intégrée dans `porteurs/{porteur}/profil.md`.

## Paramètres

- `{porteur}` : Slug de la structure
- `--url {site_web}` : Site web de la structure (optionnel)
- `--siret {numero}` : Numéro SIRET pour consultation des données légales (optionnel)

## 8 dimensions de recherche

1. **Identité légale** : Forme juridique, SIRET, date de création, siège social, représentant légal
2. **Activité & secteur** : Objet social, code NAF/APE, secteur d'activité, territoire d'intervention
3. **Capacité financière** : Budget annuel estimé, dernier bilan disponible, subventions perçues
4. **Gouvernance & équipe** : Organigramme, CA/bureau si association, effectifs, compétences clés
5. **Historique de financement** : Subventions européennes passées, dossiers FEDER/FSE+ antérieurs
6. **Ancrage territorial** : Partenariats locaux, présence en Martinique/Guadeloupe, collectivités partenaires
7. **Actualité & signaux** : Actualités récentes (6 mois), recrutements, projets en cours
8. **Conformité administrative** : Statuts à jour, obligations comptables, attestations fiscales/sociales

## Sources de données (par priorité)

1. Site web officiel de la structure → WebFetch
2. Journal officiel (associations) → jo.fr
3. Infogreffe / Societe.com (entreprises) → WebFetch
4. Data.gouv.fr — annuaire des associations / base SIRENE
5. Subventions reçues → data.gouv.fr/transparence
6. Presse locale (France-Antilles, Martinique La 1ère, etc.)

## Séquence d'exécution

1. Si `porteurs/{porteur}/profil.md` existe : lire et identifier les données manquantes
2. Collecter les données selon les 8 dimensions, en annotant la source et le niveau de confiance
3. Détecter les signaux d'alerte : structure récente (< 2 ans), dettes fiscales, liquidation judiciaire
4. Générer la fiche structurée

## Format de sortie — porteur-research.md

Écrire `porteurs/{porteur}/porteur-research.md` :

```markdown
---
porteur: {slug}
agent: porteur-research
date: {YYYY-MM-DD}
sources: [liste des sources consultées]
confiance: [Haute/Moyenne/Basse]
---

# Fiche de recherche porteur — {nom structure}

## Identité légale
| Champ | Valeur | Source | Confiance |
|-------|--------|--------|-----------|
| Forme juridique | ... | ... | ... |

## [Dimension 2 à 8]

## Signaux d'alerte
- [liste ou "Aucun signal d'alerte détecté"]

## Données manquantes
- [liste des champs non trouvés — À COMPLÉTER PAR LE PORTEUR]

## Score de complétude du profil : [X]/100
```

## Règles

- Ne jamais inventer de chiffres — "DONNÉE MANQUANTE" si information non trouvée publiquement
- Annoter systématiquement la source de chaque information
- Signaler clairement tout signal d'alerte (procédure collective, radiation, etc.)
- Si `--siret` fourni : prioriser les données officielles Sirene sur les estimations

## Exemple

```
/porteur-research association-sport-guadeloupe --url https://asso-sport-gp.fr --siret 79482736100018
```

## Sortie attendue

- `porteurs/{porteur}/porteur-research.md`
- Proposition de mise à jour de `porteurs/{porteur}/profil.md` si des données sont manquantes
- Score de complétude + liste des données restant à collecter
- Prochaine étape : `/porteur-prospect` ou `/diagnostic`
