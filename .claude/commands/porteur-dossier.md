# Commande /porteur-dossier

**Usage** : `/porteur-dossier {porteur} [--cascade] [--batch {fichier_csv}]`

**Source** : adapté de [ai-marketing-skills/lead-dossier](https://github.com/ericosiu/ai-marketing-skills)

## Description

Constitution complète du dossier administratif d'un porteur : recherche multi-sources, enrichissement en cascade, et consolidation dans le profil porteur. Pipeline complet de la collecte initiale jusqu'au profil validé prêt pour le diagnostic FEDER/FSE+.

## Paramètres

- `{porteur}` : Slug de la structure
- `--cascade` : Enrichissement en cascade (vérifie chaque source dans l'ordre jusqu'à complétion)
- `--batch {fichier_csv}` : Traitement de plusieurs porteurs depuis un fichier CSV (colonnes: slug, nom, url, siret)

## Workflow 1 — Constitution du dossier porteur (défaut)

### Collecte des paramètres

| Paramètre | Requis | Exemple |
|-----------|--------|---------|
| Nom de la structure | Oui | Association Sport Guadeloupe |
| Territoire | Oui | Guadeloupe |
| Type de structure | Oui | Association loi 1901 |
| Site web | Non | asso-sport-gp.fr |
| SIRET | Non | 79482736100018 |

### Exécution

```
1. Analyser le site web (si fourni) → extraction titre, objet, équipe, partenaires
2. Détecter la pile réglementaire : statuts, subventions passées, bilan public
3. Identifier signaux de croissance : recrutements, nouveaux projets, financements récents
4. Générer la fiche de synthèse structurée
```

Les résultats sont mis en cache 7 jours dans `.cache/porteur-research/`.

### Format de sortie JSON

```json
{
  "nom": "Association Sport Guadeloupe",
  "slug": "association-sport-guadeloupe",
  "type_structure": "Association loi 1901",
  "territoire": "Guadeloupe",
  "siret": "...",
  "objet_social": "...",
  "secteur": "Sport / Éducation populaire",
  "budget_annuel_estime": "...",
  "subventions_europeennes_passees": [...],
  "partenaires_institutionnels": [...],
  "signaux_croissance": [...],
  "signaux_alerte": [...],
  "score_completude": 75,
  "donnees_manquantes": ["bilan N-1", "statuts à jour", "attestation URSSAF"]
}
```

## Workflow 2 — Enrichissement en cascade (`--cascade`)

Logique waterfall pour compléter les données manquantes :

1. Profil existant `porteurs/{porteur}/profil.md` ? → Données extraites
2. Site web disponible ? → WebFetch extraction
3. Journal officiel / Sirene ? → Données légales officielles
4. Data.gouv.fr subventions ? → Historique de financement
5. Presse locale ? → Actualités et signaux
6. Données insuffisantes ? → Taguer comme `À COMPLÉTER PAR LE PORTEUR`

## Workflow 3 — Pipeline batch (`--batch`)

Pour traiter plusieurs porteurs simultanément :

```
Fichier CSV attendu :
slug,nom,territoire,url,siret
association-sport-gp,Association Sport GP,Guadeloupe,https://...,794827...
tpe-tech-mq,TPE Tech Martinique,Martinique,,
```

Le pipeline :
1. Charge le CSV et déduplique les entrées
2. Traite chaque porteur avec enrichissement cascade
3. Génère un profil pour chaque porteur dans `porteurs/{slug}/profil.md`
4. Produit un rapport de synthèse `porteurs/batch-rapport-{date}.md`

## Règles de sécurité

- **Ne jamais soumettre de données non vérifiées** dans un dossier officiel
- **Toujours dédupliquer** avant de créer de nouveaux profils
- **Log complet** : chaque porteur traité génère un log JSON horodaté
- **Idempotent** : relancer le pipeline ne crée pas de doublons
- **Données manquantes** : marquées explicitement, jamais inventées

## Données manquantes — procédure

Si une information n'est pas trouvable publiquement :
1. Taguer le champ : `DONNÉE MANQUANTE — À COMPLÉTER PAR LE PORTEUR`
2. Générer une liste de questions pour le porteur dans `porteurs/{porteur}/questions-porteur.md`
3. Ne pas bloquer le pipeline — continuer avec les données disponibles

## Exemple

```
/porteur-dossier association-sport-guadeloupe --cascade
```

```
/porteur-dossier --batch porteurs/batch-import-2025-01.csv
```

## Sortie attendue

- `porteurs/{porteur}/profil.md` créé ou mis à jour
- `porteurs/{porteur}/porteur-research.md` (données brutes)
- `porteurs/{porteur}/questions-porteur.md` (si données manquantes)
- Score de complétude du profil (0-100)
- Prochaine étape : `/porteur-prospect` ou directement `/diagnostic`
