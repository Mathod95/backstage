# Retirer SQLite de l'image

Changement du 2026-09-24. Statut: **appliqué dans le repo et vérifié en local, pas encore déployé**.

## Pourquoi

Backstage a besoin d'une base de données. Le modèle `create-app` en prévoit deux:
- **SQLite en mémoire** pour le développement local (`yarn start`), réglé dans `app-config.yaml` (`client: better-sqlite3`);
- **Postgres** en production, réglé dans `app-config.production.yaml` (`client: pg`), qui remplace le réglage précédent.

L'image ne sert qu'en production, donc SQLite n'y servait à rien. Pourtant le modèle l'y installait deux fois: la bibliothèque système `libsqlite3-dev` (via `apt-get` dans le `Dockerfile`) et le paquet Node `better-sqlite3` (dans les dépendances du backend). Le `Dockerfile` du modèle l'indique lui-même: "You can skip this if you don't use sqlite3 in the image, in which case you should also move better-sqlite3 to devDependencies".

## Changements

- `packages/backend/package.json`: `better-sqlite3` passe de `dependencies` à `devDependencies`. Le `Dockerfile` installe les dépendances avec `yarn workspaces focus --all --production`, qui ignore les `devDependencies`. En local, `yarn install` installe tout, donc `yarn start` continue de fonctionner sur SQLite.
- `packages/backend/Dockerfile`: le bloc `apt-get install libsqlite3-dev` est supprimé. L'image n'installe plus aucun paquet système en plus de l'image Node de base, et la construction ne dépend plus du réseau Debian.

`node-gyp` reste dans les dépendances: il sert à compiler des modules natifs si besoin, et le retirer n'a pas été étudié.

## Vérifications faites en local

- `yarn tsc` et `yarn build:backend`: OK.
- Développement local: backend lancé avec `app-config.yaml` (SQLite en mémoire), `/.backstage/health/v1/readiness` répond `ok`.
- Installation de production simulée comme dans le `Dockerfile` (`skeleton.tar.gz` puis `yarn workspaces focus --all --production`): `better-sqlite3` est absent de `node_modules`, `pg` est présent.
- Backend de production lancé depuis cette installation avec `app-config.production.yaml` et un Postgres inexistant: aucune erreur de module manquant ni de SQLite, le backend attend simplement la base.

Pas de Docker disponible dans l'environnement de travail: l'image elle-même sera construite et vérifiée par la pipeline puis par le déploiement.

## À vérifier après déploiement

- La pipeline est verte.
- `sb install mod-backstage` puis Backstage fonctionne comme avant (connexion, catalogue).
