# Commande /diagnostic

**Usage** : `/diagnostic {porteur} {description_projet}`

## Description

Lance l'agent Diagnostiqueur sur un porteur de projet pour produire un rapport d'éligibilité complet aux dispositifs FEDER/FSE+ disponibles en Martinique et Guadeloupe.

## Paramètres

- `{porteur}` : Slug identifiant unique du porteur (ex: `association-martinique-numerique`, `tpe-sarl-durand`)
- `{description_projet}` : Description courte du projet en langage naturel (ex: "création d'une plateforme e-commerce pour artisans martiniquais")

## Séquence d'exécution

1. **Vérification du profil porteur** : Lire `porteurs/{porteur}/profil.md`. Si absent, demander sa création et arrêter.
2. **Lancement du Diagnostiqueur** : Déléguer à l'agent `diagnostiqueur` avec le contexte complet (profil + description projet).
3. **Production du livrable** : Le Diagnostiqueur écrit `diagnostics/{YYYY-MM-DD}-{porteur}-eligibilite.md`.
4. **Mise à jour de la base** : Enregistrer le diagnostic en base de données via `POST /api/diagnostics/run`.
5. **Rapport à l'utilisateur** : Afficher le résumé exécutif et la décision (ELIGIBLE / NON ELIGIBLE / SOUS CONDITIONS).

## Règles

- Si `porteurs/{porteur}/profil.md` n'existe pas → demander les informations pour le créer avant de lancer le diagnostic
- Si la description projet est trop vague → poser 3 questions de cadrage maximum avant de lancer l'agent
- Toujours afficher la décision finale en clair : **ELIGIBLE**, **NON ELIGIBLE**, ou **ELIGIBLE SOUS CONDITIONS**

## Exemple

```
/diagnostic association-sport-guadeloupe "création d'un centre sportif de proximité à Pointe-à-Pitre pour les 6-18 ans, budget estimé 350 000 €"
```

## Sortie attendue

- Fichier : `diagnostics/{date}-{porteur}-eligibilite.md`
- Résumé affiché : décision + dispositifs recommandés + 3 points clés
- Prochaine étape recommandée : `/dossier-feder {porteur} {dispositif}` si éligible
