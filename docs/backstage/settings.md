---
title: Settings
description: Configuration technique de l'instance et valeurs actuelles
icon: material/tune
status: draft
createdAt: 2026-09-24
modifyAt: 2026-09-25
todo:
  - "[x] Restructurer convenablement les tableaux"
  - "[x] Les titres des tableau en anglais"
---

# Settings

> La configuration technique de l'instance: où se trouve chaque réglage et sa valeur actuelle.

La configuration est dans le repo, donc dans l'image: chaque changement demande un rebuild et un redéploiement. Les secrets n'y sont jamais: ils arrivent par des variables d'environnement (voir [Secrets](#secrets)). L'apparence et l'identité visible sont dans [Branding](personnalisation/branding.md), [Theme](personnalisation/theme.md) et [Sign-in page](personnalisation/page-de-connexion.md).

## Files

| File                         | Used for                                  | In the image |
| ---------------------------- | ----------------------------------------- | ------------ |
| `app-config.yaml`            | Réglages communs, et développement local  | Oui          |
| `app-config.production.yaml` | Production: remplace les valeurs communes | Oui          |
| `app-config.local.yaml`      | Réglages personnels en local (optionnel)  | Non          |

`app-config.local.yaml` est ignoré par git et par l'image (`.dockerignore`). Il n'existe pas aujourd'hui.

Dans l'image, les deux fichiers sont chargés explicitement au démarrage, avec `--config`, plutôt que par la variable `BACKSTAGE_ENV`:

```dockerfile title="packages/backend/Dockerfile"
CMD ["node", "packages/backend", "--config", "app-config.yaml", "--config", "app-config.production.yaml"]
```

## App

| Setting       | File                         | Current value                 |
| ------------- | ---------------------------- | ----------------------------- |
| `app.title`   | `app-config.yaml`            | `Mathod`                      |
| `app.baseUrl` | `app-config.production.yaml` | `https://backstage.mathod.fr` |
| `app.support` | `app-config.yaml`            | Non défini                    |

`app.title` s'affiche dans l'onglet du navigateur et sur la page de connexion. Sans `app.support`, Backstage affiche "Add `app.support` config key" dans son bouton d'aide et ses pages d'erreur (voir [Branding](personnalisation/branding.md#support-link)).

## Backend

| Setting                         | File                         | Current value                     |
| ------------------------------- | ---------------------------- | --------------------------------- |
| `backend.baseUrl`               | `app-config.production.yaml` | `https://backstage.mathod.fr`     |
| `backend.listen`                | `app-config.production.yaml` | `:7007`                           |
| `backend.cors.origin`           | `app-config.yaml`            | `http://localhost:3000`           |
| `backend.csp.img-src`           | `app-config.yaml`            | Le site et les avatars GitHub     |
| `backend.csp.connect-src`       | `app-config.yaml`            | Le site, et tout `http:`/`https:` |
| `backend.actions.pluginSources` | `app-config.yaml`            | `auth`, `catalog`, `scaffolder`   |

- **CORS**: la valeur est celle du développement local. En production, le front et le back sont servis par la même adresse, donc ce n'est pas bloquant, mais c'est à nettoyer (voir le todo).
- **CSP `img-src`**: autorise les photos de profil GitHub, bloquées par la politique par défaut.
- **Actions**: plugins que les assistants IA peuvent utiliser par le protocole MCP (voir [MCP](#mcp)).

## Organization

| Setting             | File              | Current value |
| ------------------- | ----------------- | ------------- |
| `organization.name` | `app-config.yaml` | `Mathod`      |

## MCP

| Setting                  | File              | Current value               |
| ------------------------ | ----------------- | --------------------------- |
| `mcpActions.name`        | `app-config.yaml` | `Mathod Backstage`          |
| `mcpActions.description` | `app-config.yaml` | Texte du modèle, en anglais |

Nom et description sous lesquels Backstage se présente à un assistant IA qui s'y connecte. Sans assistant branché, ces réglages n'ont aucun effet visible.

## Integrations

| Setting               | File              | Current value                       |
| --------------------- | ----------------- | ----------------------------------- |
| `integrations.github` | `app-config.yaml` | Token `GITHUB_TOKEN`, lecture seule |

Sert à lire le repo sur GitHub (catalogue, doc). Le token est un token fine-grained en lecture seule sur les repos publics.

## Catalog

| Setting                                | File                         | Current value                                 |
| -------------------------------------- | ---------------------------- | --------------------------------------------- |
| `catalog.locations`                    | `app-config.production.yaml` | `catalog/all.yaml`, lu sur GitHub             |
| `catalog.rules`                        | `app-config.production.yaml` | Users, groupes, templates: ce repo uniquement |
| `catalog.import.entityFilename`        | `app-config.yaml`            | `catalog-info.yaml`                           |
| `catalog.import.pullRequestBranchName` | `app-config.yaml`            | `backstage-integration`                       |

Les fichiers du catalogue sont lus sur GitHub, sans reconstruire l'image (voir [Catalogue lu depuis GitHub](../catalogue-depuis-github.md)). En local, `app-config.yaml` lit les mêmes fichiers sur le disque.

La fiche du repo lui-même, avec son propriétaire et le lien vers cette doc:

```yaml title="catalog-info.yaml"
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: backstage
  title: Backstage Mathod
  description: The Backstage instance running on backstage.mathod.fr
  annotations:
    github.com/project-slug: Mathod95/backstage
    # Docs live in docs/ with mkdocs.yml at the repo root
    backstage.io/techdocs-ref: dir:.
  tags:
    - backstage
spec:
  type: website
  owner: group:admins
  lifecycle: production
```

## Authentication

| Setting                 | File     | Current value                                     |
| ----------------------- | -------- | ------------------------------------------------- |
| `auth.environment`      | Les deux | `development` en local, `production` dans l'image |
| `auth.providers.github` | Les deux | GitHub OAuth, via `AUTH_GITHUB_*`                 |
| `signIn.resolvers`      | Les deux | `userIdMatchingUserEntityAnnotation`              |

Seul GitHub est proposé, et seuls les comptes présents dans `catalog/org.yaml` peuvent entrer (voir [Retirer les exemples et l'invité](../retirer-exemples-et-invite.md)).

## Permissions

| Setting              | File                            | Current value                              |
| -------------------- | ------------------------------- | ------------------------------------------ |
| `permission.enabled` | `app-config.yaml`               | `true`                                     |
| Politique            | `packages/backend/src/index.ts` | `allow-all`: tout le monde peut tout faire |

La vraie politique de droits est prévue avant d'ajouter une deuxième personne (voir le todo).

## Database

| Setting            | File                         | Current value                            |
| ------------------ | ---------------------------- | ---------------------------------------- |
| `backend.database` | `app-config.production.yaml` | Postgres, via les variables `POSTGRES_*` |
| `backend.database` | `app-config.yaml`            | SQLite en mémoire (local)                |

En production, Postgres est déployé par le rôle Saltbox `backstage` (conteneur `backstage-postgres`, mot de passe généré par le rôle). La recherche utilise aussi Postgres (`search-backend-module-pg`). En local, `yarn start` utilise SQLite en mémoire: les données disparaissent à chaque redémarrage. Pas encore de sauvegarde planifiée (voir le todo).

## Proxy

Non utilisé: le bloc `proxy` de `app-config.yaml` est vide. Il servirait à appeler une API externe depuis le navigateur sans exposer son token.

## TechDocs

| Setting                    | File              | Current value |
| -------------------------- | ----------------- | ------------- |
| `techdocs.builder`         | `app-config.yaml` | `local`       |
| `techdocs.generator.runIn` | `app-config.yaml` | `local`       |
| `techdocs.publisher.type`  | `app-config.yaml` | `local`       |

La doc est fabriquée dans le conteneur, à la visite (voir [TechDocs](../techdocs.md)).

## Secrets

Variables d'environnement attendues par l'image. Aucun secret n'est dans le repo.

| Variable                                                               | Used for                   | Provided by                 |
| ---------------------------------------------------------------------- | -------------------------- | --------------------------- |
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Base de données            | Rôle Saltbox `backstage`    |
| `AUTH_GITHUB_CLIENT_ID`, `AUTH_GITHUB_CLIENT_SECRET`                   | Connexion GitHub OAuth     | Inventory de l'hôte Saltbox |
| `GITHUB_TOKEN`                                                         | Lecture du repo sur GitHub | Inventory de l'hôte Saltbox |

Sur une autre plateforme (Docker Desktop, Kubernetes), ces variables devront être fournies autrement: c'est noté dans le todo.

## Sources

- [Day 183: Creating a Backstage Instance and Understanding Backstage Configuration](https://medium.com/@alokrahuldevops/day-183-creating-a-backstage-instance-and-understanding-backstage-configuration-801fd320e621), Alok Rahul, juillet 2026: structure d'une instance et principaux réglages de `app-config.yaml`
- Réglages `app.*`: schéma `node_modules/@backstage/core-app-api/config.schema.json`
