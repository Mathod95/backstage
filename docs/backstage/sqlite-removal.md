---
title: SQLite removal
description: Pourquoi et comment SQLite a été retiré de l'image de production
icon: material/database-remove
status: review
createdAt: 2026-09-24
modifyAt: 2026-09-25
todo: []
---

# SQLite removal

> Pourquoi et comment SQLite a été retiré de l'image de production.

Déployé et vérifié le 2026-09-24 (commit `3b3e345`).

## Why

Backstage a besoin d'une base de données. Le modèle `create-app` en prévoit deux:

- **SQLite en mémoire** pour le développement local (`yarn start`), réglé dans `app-config.yaml` (`client: better-sqlite3`);
- **Postgres** en production, réglé dans `app-config.production.yaml` (`client: pg`), qui remplace le réglage précédent.

L'image ne sert qu'en production, donc SQLite n'y servait à rien. Pourtant le modèle l'y installait deux fois: la bibliothèque système `libsqlite3-dev` (via `apt-get` dans le `Dockerfile`) et le paquet Node `better-sqlite3` (dans les dépendances du backend). Le `Dockerfile` du modèle l'indique lui-même: "You can skip this if you don't use sqlite3 in the image, in which case you should also move better-sqlite3 to devDependencies".

## Changes

`better-sqlite3` passe de `dependencies` à `devDependencies`. Le `Dockerfile` installe les dépendances avec `yarn workspaces focus --all --production`, qui ignore les `devDependencies`. En local, `yarn install` installe tout, donc `yarn start` continue de fonctionner sur SQLite.

```json title="packages/backend/package.json"
  "devDependencies": {
    "@backstage/cli": "^0.36.6",
    "better-sqlite3": "^12.0.0"
  },
```

Le bloc `apt-get install libsqlite3-dev` est supprimé du `Dockerfile`, remplacé par un commentaire. L'image n'installe plus SQLite, et la construction est un peu plus rapide.

```dockerfile title="packages/backend/Dockerfile"
# No sqlite3 dependencies: production uses Postgres (app-config.production.yaml),
# better-sqlite3 is a devDependency only used by `yarn start` locally.
```

`node-gyp` reste dans les dépendances: il sert à compiler des modules natifs si besoin, et le retirer n'a pas été étudié.

## Checks

Vérifié en local le 2026-09-24:

- `yarn tsc` et `yarn build:backend`: OK.
- Développement local: backend lancé avec `app-config.yaml` (SQLite en mémoire), `/.backstage/health/v1/readiness` répond `ok`.
- Installation de production simulée comme dans le `Dockerfile` (`skeleton.tar.gz` puis `yarn workspaces focus --all --production`): `better-sqlite3` est absent de `node_modules`, `pg` est présent.
- Backend de production lancé depuis cette installation avec `app-config.production.yaml` et un Postgres inexistant: aucune erreur de module manquant ni de SQLite, le backend attend simplement la base.

Vérifié après déploiement le 2026-09-24: pipeline verte (2 min 17, contre 2 min 30 avant, l'étape `apt-get` en moins), puis `sb install mod-backstage`. Backstage fonctionne comme avant: connexion GitHub, photo de profil, catalogue.

## Sources

- Commentaire du `Dockerfile` généré par `@backstage/create-app` (Backstage 1.55.0)
