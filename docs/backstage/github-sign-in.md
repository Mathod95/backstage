---
title: GitHub sign-in
description: Passage de la connexion invité à GitHub OAuth et retrait des données d'exemple
icon: material/github
status: review
createdAt: 2026-09-24
modifyAt: 2026-09-25
todo: []
---

# GitHub sign-in

> Comment la connexion invité a été remplacée par GitHub OAuth, et les données d'exemple retirées.

Ce qui suit est la procédure suivie, d'après la documentation officielle (voir [Sources](#sources)) et le code du repo (Backstage 1.55.0, nouveau système frontend). La configuration qui en résulte est décrite dans [Settings](settings.md#authentication).

## Before starting

**On ne peut pas retirer l'invité sans le remplacer.** Dans le nouveau système frontend, la page de connexion par défaut (`DefaultSignInPage`, paquet `@backstage/plugin-app`) ne propose que le fournisseur `guest`. Sans autre page de connexion, le bouton "Enter" reste affiché mais échoue. Retirer l'invité revient donc à mettre en place GitHub OAuth dans le même lot de changements.

L'invité était présent à 6 endroits:

| Location                        | Content                               | Action                         |
| ------------------------------- | ------------------------------------- | ------------------------------ |
| `packages/backend/src/index.ts` | Module `guest-provider`               | Remplacer par le module GitHub |
| `packages/backend/package.json` | Dépendance du module invité           | `yarn remove`                  |
| `app-config.yaml`               | `auth.providers.guest: {}`            | Remplacer par `github`         |
| `app-config.production.yaml`    | `auth.providers.guest: {}`            | Remplacer par `github`         |
| Page de connexion (frontend)    | `DefaultSignInPage`, invité seulement | Page GitHub dans `App.tsx`     |
| Inventory de l'hôte Saltbox     | Ligne `APP_CONFIG_..._guest_...`      | Supprimer la ligne             |

La ligne de l'Inventory était `APP_CONFIG_auth_providers_guest_dangerouslyAllowOutsideDevelopment: "true"`. S'y ajoutaient les entités `user:guest` et `group:guests` de `examples/org.yaml`.

Les données d'exemple étaient présentes à 4 endroits:

| Location                 | Content                                                                |
| ------------------------ | ---------------------------------------------------------------------- |
| `examples/entities.yaml` | System `examples`, Component `example-website`, API `example-grpc-api` |
| `examples/org.yaml`      | User `guest`, Group `guests`                                           |
| `examples/template/`     | Template d'exemple du scaffolder                                       |
| Config et `Dockerfile`   | `catalog.locations` et ligne `COPY examples`                           |

- **Les entités d'exemple disparaissent toutes seules de la base**: une location retirée de la configuration rend ses entités orphelines, et elles sont supprimées automatiquement par défaut.
- **Un utilisateur doit exister dans le catalogue pour se connecter.** Le résolveur `userIdMatchingUserEntityAnnotation` cherche une entité `User` dont l'annotation `github.com/user-id` correspond au compte GitHub. Il faut donc la créer avant de supprimer `examples/org.yaml`.

## Steps

1. Créer l'application OAuth GitHub.
2. Créer les vraies données d'organisation (`catalog/org.yaml`).
3. Backend: remplacer le module invité par le module GitHub.
4. Frontend: remplacer la page de connexion.
5. Configuration: fournisseur `github` et nouvelles locations du catalogue.
6. Supprimer `examples/` et adapter le `Dockerfile`.
7. Adapter le test e2e.
8. Mettre à jour l'Inventory de l'hôte et déployer.
9. Vérifier.

Les étapes 2 à 7 touchent le repo et partent dans le même commit: un déploiement intermédiaire casserait la connexion.

## 1. OAuth app

Application créée sur <https://github.com/settings/applications/new>:

| Field                     | Value                                                       |
| ------------------------- | ----------------------------------------------------------- |
| Application name          | `Backstage`                                                 |
| Homepage URL              | `https://backstage.mathod.fr`                               |
| Redirect URI              | `https://backstage.mathod.fr/api/auth/github/handler/frame` |
| Allow wildcard matching   | Décoché                                                     |
| Enable Device Flow        | Décoché                                                     |
| Expire user access tokens | Coché (valeur par défaut)                                   |

- **Adresse de retour**: son format est `<backend.baseUrl>/api/auth/github/handler/frame`.
- **Plusieurs environnements**: une application accepte jusqu'à 10 Redirect URIs (constaté le 2026-09-24). Une seule application peut donc servir plusieurs environnements, en ajoutant par exemple `http://localhost:7007/api/auth/github/handler/frame` pour le local.
- **Nouvelle application**: l'ancien secret OAuth de l'ancienne instance était considéré comme compromis, l'ancienne application a été supprimée.

### Credentials

L'image est publique: les identifiants ne vont jamais dans l'image ni dans le repo. L'image attend `AUTH_GITHUB_CLIENT_ID` et `AUTH_GITHUB_CLIENT_SECRET`, fournis par la plateforme qui lance le conteneur.

| Platform            | Provided by                                              | Status                   |
| ------------------- | -------------------------------------------------------- | ------------------------ |
| Hôte Saltbox        | Inventory de l'hôte, `backstage_role_docker_envs_custom` | En place                 |
| Développement local | Shell ou `app-config.local.yaml`                         | Au besoin                |
| Docker Desktop      | Fichier `.env` local non versionné                       | À définir le moment venu |
| Kubernetes          | `Secret` Kubernetes                                      | À définir le moment venu |

L'Inventory Saltbox est spécifique à cette plateforme. Il ne contient que des valeurs secrètes, jamais de surcharge de configuration, pour que la même image reste déployable ailleurs.

## 2. Organization data

```yaml title="catalog/org.yaml"
---
# https://backstage.io/docs/features/software-catalog/descriptor-format#kind-user
apiVersion: backstage.io/v1alpha1
kind: User
metadata:
  name: mathod
  annotations:
    # GraphQL node_id of the GitHub account, not the numeric REST id
    github.com/user-id: MDQ6VXNlcjMyNzk1NzQ4
spec:
  memberOf: [admins]
---
# https://backstage.io/docs/features/software-catalog/descriptor-format#kind-group
apiVersion: backstage.io/v1alpha1
kind: Group
metadata:
  name: admins
spec:
  type: team
  children: []
```

- **`node_id`**: lu sur l'API publique (`curl -s https://api.github.com/users/Mathod95`, champ `node_id`). L'annotation attend ce `node_id`, pas l'identifiant numérique.
- **Nom de l'entité**: `mathod`, libre, puisque le lien avec le compte GitHub passe par l'annotation.

## 3. Backend

```bash
yarn --cwd packages/backend remove @backstage/plugin-auth-backend-module-guest-provider
```

Le module GitHub faisait déjà partie des dépendances du modèle `create-app`.

=== "Before"

    ```ts title="packages/backend/src/index.ts"
    // auth plugin
    backend.add(import('@backstage/plugin-auth-backend'));
    // See https://backstage.io/docs/backend-system/building-backends/migrating#the-auth-plugin
    backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
    // See https://backstage.io/docs/auth/guest/provider
    ```

=== "After"

    ```ts title="packages/backend/src/index.ts"
    // auth plugin
    backend.add(import('@backstage/plugin-auth-backend'));
    // See https://backstage.io/docs/auth/github/provider
    backend.add(import('@backstage/plugin-auth-backend-module-github-provider'));
    ```

## 4. Sign-in page

Les paquets nécessaires étaient déjà dans `packages/app/package.json`. La page vient de la doc officielle, adaptée aux modules du repo:

```tsx title="packages/app/src/App.tsx"
import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { githubAuthApiRef } from '@backstage/core-plugin-api';
import { SignInPageBlueprint } from '@backstage/plugin-app-react';
import { SignInPage } from '@backstage/core-components';
import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { navModule } from './modules/nav';
import { homeModule } from './modules/home';

// Replaces the default sign-in page, which only offers the guest provider.
// See https://backstage.io/docs/getting-started/config/authentication
const signInPage = SignInPageBlueprint.make({
  params: {
    loader: async () => props =>
      (
        <SignInPage
          {...props}
          provider={{
            id: 'github-auth-provider',
            title: 'GitHub',
            message: 'Sign in using GitHub',
            apiRef: githubAuthApiRef,
          }}
        />
      ),
  },
});

export default createApp({
  features: [
    catalogPlugin,
    navModule,
    homeModule,
    createFrontendModule({
      pluginId: 'app',
      extensions: [signInPage],
    }),
  ],
});
```

Déclarée dans un module du plugin `app`, cette extension prend l'identifiant `sign-in-page:app` et remplace la `DefaultSignInPage`.

## 5. Configuration

`auth.environment` choisit le bloc de réglages du fournisseur: `development` en local, `production` dans l'image. Les deux fichiers sont fusionnés en production, donc le bloc `development` existe aussi dans le conteneur, mais il n'est pas lu.

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

Les locations d'exemple de `catalog.locations` ont été remplacées par `catalog/org.yaml`. Le catalogue est lu depuis sur GitHub, à partir d'un sommaire unique (voir [Catalog](catalog.md)).

## 6. Examples removal

```bash
git rm -r examples
```

La ligne `COPY --chown=node:node examples ./examples` du `Dockerfile` a été retirée. Le catalogue n'est plus copié dans l'image (voir [Catalog](catalog.md)).

## 7. End-to-end test

`packages/app/e2e-tests/app.test.ts` cliquait sur le bouton invité "Enter". Il vérifie maintenant que la page de connexion propose GitHub et plus l'invité. Il ne tourne pas dans la pipeline.

## 8. Deployment

Spécifique à Saltbox. Dans l'Inventory de l'hôte, dans `backstage_role_docker_envs_custom`: ajouter `AUTH_GITHUB_CLIENT_ID` et `AUTH_GITHUB_CLIENT_SECRET`, puis supprimer la ligne invité. Les valeurs sont saisies avec `read -rs`, pour ne pas les laisser dans l'historique du shell:

```bash
INV=/srv/git/saltbox/inventories/host_vars/localhost.yml
cp "$INV" "$INV.bak-$(date +%F)"
grep -n -A5 '^backstage_role_docker_envs_custom:' "$INV"

read -rp 'Client ID: ' GH_ID
read -rsp 'Client Secret: ' GH_SECRET; echo
sed -i "/^backstage_role_docker_envs_custom:/a\  AUTH_GITHUB_CLIENT_ID: \"$GH_ID\"\n  AUTH_GITHUB_CLIENT_SECRET: \"$GH_SECRET\"" "$INV"
unset GH_ID GH_SECRET

grep -n -A5 '^backstage_role_docker_envs_custom:' "$INV" | sed 's/\(SECRET: "\).*"/\1***"/'
```

La ligne invité ne doit être supprimée qu'au moment de déployer la nouvelle image, sinon l'instance en place devient inaccessible:

```bash
sed -i '/APP_CONFIG_auth_providers_guest_dangerouslyAllowOutsideDevelopment/d' "$INV"
```

Puis le déploiement habituel (voir [Deployment](deployment.md)). Authelia reste devant Backstage: le retour de GitHub passe par Authelia sans problème, puisque la personne a déjà une session Authelia.

## 9. Checks

Vérifié le 2026-09-24:

- La page de connexion ne propose que GitHub, plus de bouton "Enter".
- La connexion avec le compte `Mathod95` aboutit, et le profil affiche `user:default/mathod`.
- Le catalogue ne contient plus les entités d'exemple.

Avant le déploiement, vérifié en local: `yarn tsc`, `yarn build:backend`, `config:check`, validation des entités de `catalog/org.yaml`, et redirection de `/api/auth/github/start` vers GitHub avec la bonne adresse de retour.

## Profile picture

Après le déploiement, la photo de profil GitHub ne s'affichait pas. Une fois l'application servie par le backend (image de production), la politique de sécurité par défaut (CSP) limite les images à `'self' data:`, ce qui bloque `avatars.githubusercontent.com`. En local, `yarn start` n'applique pas cette politique, d'où la différence. Corrigé dans `backend.csp`:

```yaml title="app-config.yaml"
    img-src: ["'self'", 'data:', 'https://avatars.githubusercontent.com']
```

Confirmé après déploiement le 2026-09-24: la photo de profil s'affiche.

## Rollback

Revenir au commit précédent et redéployer, puis remettre la ligne `dangerouslyAllowOutsideDevelopment` dans l'Inventory. Les entités d'exemple sont recréées au premier passage du catalogue.

## Sources

- Fournisseur invité: <https://backstage.io/docs/auth/guest/provider>
- Authentification GitHub dans une app `create-app`: <https://backstage.io/docs/getting-started/config/authentication>
- Fournisseur GitHub: <https://backstage.io/docs/auth/github/provider>
- Authentification en général: <https://backstage.io/docs/auth/>
- Configuration du catalogue: <https://backstage.io/docs/features/software-catalog/configuration>
- Page de connexion par défaut: `node_modules/@backstage/plugin-app/dist/extensions/DefaultSignInPage.esm.js`
