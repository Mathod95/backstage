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

=== "app-config.yaml"

    ```yaml title="app-config.yaml"
    app:
      title: Mathod
      baseUrl: http://localhost:3000
    ```

=== "app-config.production.yaml"

    ```yaml title="app-config.production.yaml"
    app:
      baseUrl: https://backstage.mathod.fr
    ```

`app.title` s'affiche dans l'onglet du navigateur et sur la page de connexion. `app.support` n'est pas défini: Backstage affiche alors "Add `app.support` config key" dans son bouton d'aide et ses pages d'erreur (voir [Branding](personnalisation/branding.md#support-link)).

## Backend

=== "app-config.yaml"

    ```yaml title="app-config.yaml"
    backend:
      baseUrl: http://localhost:7007
      listen:
        port: 7007
      csp:
        connect-src: ["'self'", 'http:', 'https:']
        img-src: ["'self'", 'data:', 'https://avatars.githubusercontent.com']
      cors:
        origin: http://localhost:3000
        methods: [GET, HEAD, PATCH, POST, PUT, DELETE]
        credentials: true
      actions:
        pluginSources:
          - auth
          - catalog
          - scaffolder
    ```

=== "app-config.production.yaml"

    ```yaml title="app-config.production.yaml"
    backend:
      baseUrl: https://backstage.mathod.fr
      listen: ':7007'
    ```

- **CORS**: la valeur est celle du développement local. En production, le front et le back sont servis par la même adresse, donc ce n'est pas bloquant, mais c'est à nettoyer (voir le todo).
- **CSP `img-src`**: autorise les photos de profil GitHub, bloquées par la politique par défaut.
- **Actions**: plugins que les assistants IA peuvent utiliser par le protocole MCP (voir [MCP](#mcp)).

## Organization

```yaml title="app-config.yaml"
organization:
  name: Mathod
```

## MCP

```yaml title="app-config.yaml"
mcpActions:
  name: 'Mathod Backstage' # defaults to "backstage"
  description: 'Tools for managing your software catalog, creating new services from templates, and exploring your developer portal' # optional
```

Nom et description sous lesquels Backstage se présente à un assistant IA qui s'y connecte. Sans assistant branché, ces réglages n'ont aucun effet visible.

## Integrations

```yaml title="app-config.yaml"
integrations:
  github:
    - host: github.com
      token: ${GITHUB_TOKEN}
```

Sert à lire le repo sur GitHub (catalogue, doc). Le token est un token fine-grained en lecture seule sur les repos publics.

## Catalog

=== "app-config.yaml"

    ```yaml title="app-config.yaml"
    catalog:
      import:
        entityFilename: catalog-info.yaml
        pullRequestBranchName: backstage-integration
      rules:
        - allow: [Component, System, API, Resource, Location, User, Group, Template]
      locations:
        - type: file
          target: ../../catalog/all.yaml
    ```

=== "app-config.production.yaml"

    ```yaml title="app-config.production.yaml"
    catalog:
      rules:
        - allow: [Component, System, API, Resource, Location]
        - allow: [Location, User, Group, Component, System, API, Resource, Template]
          locations:
            - type: url
              pattern: https://github.com/Mathod95/backstage/blob/main/**
      locations:
        - type: url
          target: https://github.com/Mathod95/backstage/blob/main/catalog/all.yaml
    ```

Les fichiers du catalogue sont lus sur GitHub en production, sans reconstruire l'image (voir [Catalogue lu depuis GitHub](../catalogue-depuis-github.md)). En local, les mêmes fichiers sont lus sur le disque. En production, les utilisateurs, groupes et templates ne sont acceptés que s'ils viennent de ce repo.

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

=== "app-config.yaml"

    ```yaml title="app-config.yaml"
    auth:
      environment: development
      providers:
        github:
          development:
            clientId: ${AUTH_GITHUB_CLIENT_ID}
            clientSecret: ${AUTH_GITHUB_CLIENT_SECRET}
            signIn:
              resolvers:
                - resolver: userIdMatchingUserEntityAnnotation
      clientIdMetadataDocuments:
        enabled: false
    ```

=== "app-config.production.yaml"

    ```yaml title="app-config.production.yaml"
    auth:
      environment: production
      providers:
        github:
          production:
            clientId: ${AUTH_GITHUB_CLIENT_ID}
            clientSecret: ${AUTH_GITHUB_CLIENT_SECRET}
            signIn:
              resolvers:
                - resolver: userIdMatchingUserEntityAnnotation
    ```

Seul GitHub est proposé, et seuls les comptes présents dans `catalog/org.yaml` peuvent entrer (voir [Retirer les exemples et l'invité](../retirer-exemples-et-invite.md)).

## Permissions

```yaml title="app-config.yaml"
permission:
  enabled: true
```

La politique est `allow-all`: toute personne connectée peut tout faire.

```ts title="packages/backend/src/index.ts"
// permission plugin
backend.add(import('@backstage/plugin-permission-backend'));
// See https://backstage.io/docs/permissions/getting-started for how to create your own permission policy
backend.add(
  import('@backstage/plugin-permission-backend-module-allow-all-policy'),
);
```

La vraie politique de droits est prévue avant d'ajouter une deuxième personne (voir le todo).

## Database

=== "app-config.yaml"

    ```yaml title="app-config.yaml"
    backend:
      database:
        client: better-sqlite3
        connection: ':memory:'
    ```

=== "app-config.production.yaml"

    ```yaml title="app-config.production.yaml"
    backend:
      database:
        client: pg
        connection:
          host: ${POSTGRES_HOST}
          port: ${POSTGRES_PORT}
          user: ${POSTGRES_USER}
          password: ${POSTGRES_PASSWORD}
    ```

En production, Postgres est déployé par le rôle Saltbox `backstage` (conteneur `backstage-postgres`, mot de passe généré par le rôle). La recherche utilise aussi Postgres (`search-backend-module-pg`). En local, `yarn start` utilise SQLite en mémoire: les données disparaissent à chaque redémarrage. Pas encore de sauvegarde planifiée (voir le todo).

## Proxy

Non utilisé: le bloc `proxy` de `app-config.yaml` ne contient que des commentaires. Il servirait à appeler une API externe depuis le navigateur sans exposer son token.

## TechDocs

```yaml title="app-config.yaml"
techdocs:
  builder: 'local' # Alternatives - 'external'
  generator:
    runIn: 'local'
  publisher:
    type: 'local' # Alternatives - 'googleGcs' or 'awsS3'. Read documentation for using alternatives.
```

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
