# Google Stitch

Madin'Admin utilise `@google/stitch-sdk` pour générer des propositions UI à partir d'un prompt produit.

## Configuration

Ajoutez une clé Stitch dans `.env.local` :

```bash
STITCH_API_KEY=...
```

Alternative OAuth possible :

```bash
STITCH_ACCESS_TOKEN=...
GOOGLE_CLOUD_PROJECT=...
```

## Générer des écrans Madin'Admin

```bash
npm run stitch:madin
```

Le script crée un projet Google Stitch, génère une version `DESKTOP` et une version `MOBILE`, puis écrit les liens de consultation dans :

```text
reports/stitch/
```

Les rapports contiennent :

- l'identifiant du projet Stitch ;
- l'identifiant de chaque écran ;
- l'URL HTML ;
- l'URL image.

## Intention UX

Le prompt cible un rendu institutionnel inspiré des portails publics français, sans utiliser de marque officielle. Il conserve les contraintes Madin'Admin : aides FEDER, Agir Plus, accessibilité, dark/light mode, notification type snackbar et parcours orienté dossier.
