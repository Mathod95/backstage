# Retirer les données d'exemple et l'utilisateur invité

Procédure pour sortir du Backstage stock: supprimer tout ce que `@backstage/create-app` a généré comme données de démonstration (dossier `examples/`) et retirer complètement la connexion invité, au profit d'une connexion GitHub OAuth.

Rédigé le 2026-09-24 à partir de la documentation officielle (liens en fin de document) et du code de ce repo (Backstage 1.55.0, nouveau système frontend). Statut: **étapes 1 à 7 appliquées le 2026-09-24 (repo modifié, pas encore commité ni déployé)**. Voir [Journal d'application](#journal-dapplication) en fin de document.

## À savoir avant de commencer

**On ne peut pas retirer l'invité sans le remplacer.** Dans le nouveau système frontend, la page de connexion par défaut est l'extension `DefaultSignInPage` du paquet `@backstage/plugin-app`, et elle ne propose qu'un seul fournisseur: `guest` (vérifié dans `node_modules/@backstage/plugin-app/dist/extensions/DefaultSignInPage.esm.js`). Si on retire le module invité côté backend sans fournir une autre page de connexion, le bouton "Enter" reste affiché mais échoue, et plus personne ne peut entrer. Retirer l'invité revient donc à mettre en place GitHub OAuth dans le même lot de changements.

**L'invité est présent à 6 endroits**, qu'il faut tous traiter pour que le retrait soit complet:

| Endroit | Contenu | Action |
|---|---|---|
| `packages/backend/src/index.ts` | `plugin-auth-backend-module-guest-provider` | Remplacer par le module GitHub |
| `packages/backend/package.json` | Dépendance du module invité | `yarn remove` |
| `app-config.yaml` | `auth.providers.guest: {}` | Remplacer par `github` |
| `app-config.production.yaml` | `auth.providers.guest: {}` | Remplacer par `github` |
| Page de connexion (frontend) | `DefaultSignInPage` qui ne propose que `guest` | Surcharger avec une page GitHub dans `App.tsx` |
| Inventory de l'hôte Saltbox | `APP_CONFIG_auth_providers_guest_dangerouslyAllowOutsideDevelopment: "true"` | Supprimer la ligne |

S'y ajoutent les entités `user:guest` et `group:guests` de `examples/org.yaml`, qui disparaissent avec les exemples.

**Les données d'exemple sont présentes à 4 endroits:**

| Endroit | Contenu |
|---|---|
| `examples/entities.yaml` | System `examples`, Component `example-website`, API `example-grpc-api` (tous possédés par `guests`) |
| `examples/org.yaml` | User `guest`, Group `guests` |
| `examples/template/` | Template d'exemple du scaffolder (`owner: user:guest`) |
| `catalog.locations` de `app-config.yaml` et `app-config.production.yaml`, ligne `COPY examples` du `Dockerfile` | Chargement de ces fichiers |

**Les entités d'exemple disparaîtront toutes seules de la base.** La doc du catalogue indique que les locations déclarées dans la configuration ne peuvent être retirées qu'en les enlevant de la configuration, et que les entités devenues orphelines sont supprimées automatiquement par défaut (`catalog.orphanStrategy`, dont la valeur par défaut est la suppression). Aucun nettoyage manuel de Postgres n'est nécessaire.

**Un utilisateur doit exister dans le catalogue pour pouvoir se connecter.** Le résolveur recommandé, `userIdMatchingUserEntityAnnotation`, cherche une entité `User` dont l'annotation `github.com/user-id` correspond au compte GitHub. Il faut donc créer cette entité avant de supprimer `examples/org.yaml`, sinon la connexion échoue avec une erreur de résolution d'identité.

## Ordre des étapes

1. Créer les applications OAuth GitHub.
2. Créer les vraies données d'organisation (`catalog/org.yaml`).
3. Backend: remplacer le module invité par le module GitHub.
4. Frontend: remplacer la page de connexion.
5. Configuration: fournisseur `github` et nouvelles locations du catalogue.
6. Supprimer `examples/` et adapter le `Dockerfile`.
7. Adapter le test e2e.
8. Mettre à jour l'Inventory de l'hôte et déployer.
9. Vérifier.

Les étapes 2 à 7 touchent le repo et doivent partir dans le même commit (ou la même PR): un déploiement intermédiaire casserait la connexion.

## 1. Applications OAuth GitHub

Créer une application OAuth sur <https://github.com/settings/applications/new>:

| Champ | Valeur |
|---|---|
| Application name | `Backstage` |
| Homepage URL | `https://backstage.mathod.fr` |
| Redirect URI | `https://backstage.mathod.fr/api/auth/github/handler/frame` |
| Allow wildcard matching | Décoché |
| Enable Device Flow | Décoché |
| Expire user access tokens | Coché (valeur par défaut) |

Le format de l'URL de redirection est `<backend.baseUrl>/api/auth/github/handler/frame`, d'après la doc officielle. Le formulaire GitHub accepte désormais jusqu'à 10 Redirect URIs par application (constaté le 2026-09-24): une seule application peut donc servir plusieurs environnements, en ajoutant par exemple `http://localhost:7007/api/auth/github/handler/frame` pour le développement local. Chaque environnement ajouté (Docker Desktop, Kubernetes) nécessite simplement sa propre Redirect URI.

"Expire user access tokens" n'est pas évoqué par la doc Backstage: à surveiller pendant la vérification (étape 9). Si la session casse au bout de quelques heures, décocher l'option.

Générer ensuite un Client Secret et noter le Client ID. C'est une **nouvelle** application: l'ancien secret OAuth de l'ancienne instance est considéré comme compromis et ne doit pas être réutilisé (penser à supprimer l'ancienne application OAuth sur GitHub).

### Où vivent les identifiants

L'image est publique sur GHCR: les identifiants ne vont jamais dans l'image ni dans le repo. L'image attend deux variables d'environnement, `AUTH_GITHUB_CLIENT_ID` et `AUTH_GITHUB_CLIENT_SECRET`, et c'est à la plateforme qui lance le conteneur de les fournir. C'est le contrat de l'image: la configuration applicative est dans le repo, seules les valeurs secrètes viennent de la plateforme.

| Plateforme | Qui fournit les variables | Statut |
|---|---|---|
| Hôte Saltbox | Inventory de l'hôte, `backstage_role_docker_envs_custom` (étape 8) | Retenu pour l'instant |
| Développement local (`yarn start`) | Shell ou `app-config.local.yaml` (ignoré par git et par `.dockerignore`) | Au besoin |
| Docker Desktop | Fichier `.env` local non versionné (`docker run --env-file`) | À définir le moment venu |
| Kubernetes | `Secret` Kubernetes (éventuellement alimenté par un gestionnaire de secrets) | À définir le moment venu |

**Le passage par l'Inventory Saltbox est spécifique à cette plateforme.** Il ne doit rien contenir d'autre que des valeurs secrètes (pas de surcharge de configuration comme l'ancienne ligne `APP_CONFIG_...guest...`), pour que la même image reste déployable ailleurs en fournissant les mêmes variables.

## 2. Données d'organisation réelles

Créer un dossier `catalog/` à la racine du repo pour les vraies données du catalogue, séparé des exemples. Fichier `catalog/org.yaml`:

```yaml
---
# https://backstage.io/docs/features/software-catalog/descriptor-format#kind-user
apiVersion: backstage.io/v1alpha1
kind: User
metadata:
  name: mathod
  annotations:
    # node_id GraphQL du compte GitHub, pas l'id numérique (32795748)
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

Le `node_id` a été lu le 2026-09-24 sur l'API publique: `curl -s https://api.github.com/users/Mathod95`, champ `node_id`. Le nom du groupe (`admins`) est une proposition: il servira de propriétaire aux entités et de base à la future politique de permissions.

## 3. Backend

Depuis la racine du repo:

```bash
yarn --cwd packages/backend add @backstage/plugin-auth-backend-module-github-provider
yarn --cwd packages/backend remove @backstage/plugin-auth-backend-module-guest-provider
```

Constaté à l'application: `@backstage/plugin-auth-backend-module-github-provider` fait déjà partie des dépendances du modèle `create-app`, la commande `add` ne change donc rien. Seul le retrait du module invité modifie `package.json` et `yarn.lock`.

Dans `packages/backend/src/index.ts`, remplacer le bloc du module invité:

```ts
// auth plugin
backend.add(import('@backstage/plugin-auth-backend'));
// See https://backstage.io/docs/backend-system/building-backends/migrating#the-auth-plugin
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
// See https://backstage.io/docs/auth/guest/provider
```

par:

```ts
// auth plugin
backend.add(import('@backstage/plugin-auth-backend'));
// See https://backstage.io/docs/auth/github/provider
backend.add(import('@backstage/plugin-auth-backend-module-github-provider'));
```

## 4. Frontend: page de connexion

Les paquets nécessaires (`@backstage/core-plugin-api`, `@backstage/plugin-app-react`, `@backstage/core-components`, `@backstage/frontend-plugin-api`) sont déjà dans `packages/app/package.json`, rien à installer.

Remplacer `packages/app/src/App.tsx` par la version de la doc officielle, adaptée aux modules existants du repo:

```tsx
import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { githubAuthApiRef } from '@backstage/core-plugin-api';
import { SignInPageBlueprint } from '@backstage/plugin-app-react';
import { SignInPage } from '@backstage/core-components';
import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { navModule } from './modules/nav';
import { homeModule } from './modules/home';

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

Déclarée dans un module du plugin `app`, cette extension prend l'identifiant `sign-in-page:app` et remplace la `DefaultSignInPage` (celle qui ne propose que l'invité).

## 5. Configuration

### `app-config.yaml` (développement local)

Remplacer le fournisseur invité:

```yaml
auth:
  # see https://backstage.io/docs/auth/ to learn about auth providers
  providers:
    # See https://backstage.io/docs/auth/guest/provider
    guest: {}
```

par:

```yaml
auth:
  # see https://backstage.io/docs/auth/ to learn about auth providers
  environment: development
  providers:
    # See https://backstage.io/docs/auth/github/provider
    github:
      development:
        clientId: ${AUTH_GITHUB_CLIENT_ID}
        clientSecret: ${AUTH_GITHUB_CLIENT_SECRET}
        signIn:
          resolvers:
            - resolver: userIdMatchingUserEntityAnnotation
```

(garder le bloc `clientIdMetadataDocuments` qui suit, il n'est pas lié à l'invité).

Remplacer les trois locations d'exemple de `catalog.locations` (et les deux exemples commentés) par:

```yaml
  locations:
    # Organizational data, file locations are relative to the backend process, typically `packages/backend`
    - type: file
      target: ../../catalog/org.yaml
      rules:
        - allow: [User, Group]
```

### `app-config.production.yaml`

Remplacer:

```yaml
auth:
  providers:
    guest: {}
```

par:

```yaml
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

Chaque fournisseur a une configuration par environnement (`development`, `production`...), et `auth.environment` choisit celle qui est utilisée. Les deux fichiers étant fusionnés en production (`--config app-config.yaml --config app-config.production.yaml`), le bloc `development` existe aussi dans le conteneur mais n'est pas lu.

Remplacer les locations d'exemple de `catalog.locations` par:

```yaml
catalog:
  # Overrides the default list locations from app-config.yaml.
  locations:
    # File locations are relative to the backend process, in the Docker container this is the root (/app)
    - type: file
      target: ./catalog/org.yaml
      rules:
        - allow: [User, Group]
```

## 6. Supprimer `examples/` et adapter l'image

```bash
git rm -r examples
```

Dans `packages/backend/Dockerfile`, remplacer:

```dockerfile
# This will include the examples, if you don't need these simply remove this line
COPY --chown=node:node examples ./examples
```

par:

```dockerfile
# Catalog data (organization, later templates) loaded through catalog.locations
COPY --chown=node:node catalog ./catalog
```

Le `catalog-info.yaml` à la racine décrit le repo lui-même (`owner: john@example.com`). Il n'est chargé par aucune location, il ne gêne donc pas. À corriger (`owner: group:admins`, description) le jour où on l'enregistre dans le catalogue.

## 7. Test e2e

`packages/app/e2e-tests/app.test.ts` clique sur le bouton invité "Enter" et échouera. Il ne tourne pas dans la pipeline actuelle, mais pour le garder cohérent: soit le supprimer, soit le réduire à vérifier que la page de connexion affiche le fournisseur GitHub (un vrai parcours OAuth n'est pas testable simplement en e2e).

## 8. Inventory de l'hôte et déploiement

Spécifique à Saltbox (voir "Où vivent les identifiants" à l'étape 1). Dans l'Inventory de l'hôte, dans `backstage_role_docker_envs_custom`:
- **supprimer** `APP_CONFIG_auth_providers_guest_dangerouslyAllowOutsideDevelopment: "true"`;
- **ajouter** `AUTH_GITHUB_CLIENT_ID` et `AUTH_GITHUB_CLIENT_SECRET` (valeurs de l'application OAuth).

Commandes sur l'hôte. Les valeurs sont saisies avec `read -rs`, pour ne pas les laisser dans l'historique du shell. Elles supposent que `backstage_role_docker_envs_custom` est déjà écrit en bloc (une clé par ligne, indentée de 2 espaces), ce qui est le cas avec la ligne invité:

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

Les deux variables peuvent être ajoutées avant le déploiement de la nouvelle image: elles ne sont lues qu'au prochain `sb install mod-backstage`. La ligne invité, elle, ne doit être supprimée qu'au moment de déployer la nouvelle image, sinon l'instance actuelle (qui n'a que l'invité) devient inaccessible:

```bash
sed -i '/APP_CONFIG_auth_providers_guest_dangerouslyAllowOutsideDevelopment/d' "$INV"
```

Puis le déploiement habituel: pousser sur `main`, attendre que la pipeline soit verte, relancer `sb install mod-backstage`.

Authelia reste devant Backstage à ce stade. Le callback OAuth passe par Authelia sans problème, puisque l'utilisateur a déjà une session Authelia quand il clique sur "Sign in". Garder ou non Authelia est une décision séparée (voir [todo.md](todo.md)).

## 9. Vérification

- La page de connexion ne propose que GitHub, plus de bouton "Enter".
- La connexion avec le compte `Mathod95` aboutit, et le profil (menu Settings) affiche `user:default/mathod`.
- Une connexion avec un autre compte GitHub est refusée (aucune entité `User` correspondante).
- Le catalogue ne contient plus `example-website`, `example-grpc-api`, `examples`, `guest` ni `guests`. La page Create ne propose plus de template.
- Les logs du conteneur ne mentionnent plus le fournisseur `guest`.

## Journal d'application

2026-09-24, dans le repo (étapes 1 à 7):
- Étape 1: application OAuth GitHub créée par l'utilisateur. `AUTH_GITHUB_CLIENT_ID` et `AUTH_GITHUB_CLIENT_SECRET` ajoutés dans l'Inventory de l'hôte (la ligne invité y est conservée jusqu'au déploiement).
- Étape 2: `catalog/org.yaml` créé. L'utilisateur s'appelle `mathod` (choix de l'utilisateur, pas `mathod95`): le lien avec le compte GitHub se fait par l'annotation `github.com/user-id`, le nom de l'entité est libre.
- Étapes 3 à 7 appliquées telles que décrites.

Vérifications faites en local:
- `yarn tsc`, `yarn build:backend` et Prettier: OK.
- `backstage-cli config:check --lax` sur `app-config.yaml` et `app-config.production.yaml`: OK.
- Entités de `catalog/org.yaml` validées avec les politiques de `@backstage/catalog-model`: OK.
- Backend démarré avec des identifiants factices: le fournisseur `github` est configuré (`Configuring auth provider: github`), `/api/auth/github/start` redirige vers `github.com/login/oauth/authorize` avec la bonne URL de callback, `/api/auth/guest/refresh` répond 404.

Reste à faire: commit, déploiement (étape 8, dont la suppression de la ligne invité dans l'Inventory), vérification réelle (étape 9).

## Retour arrière

Revenir au commit précédent et redéployer, puis remettre la ligne `dangerouslyAllowOutsideDevelopment` dans l'Inventory. Les entités d'exemple sont recréées au premier passage du catalogue.

## Sources

Documentation officielle consultée le 2026-09-24:
- Fournisseur invité: <https://backstage.io/docs/auth/guest/provider> (réservé au développement, désactivé hors développement sauf `dangerouslyAllowOutsideDevelopment`).
- Mise en place de l'authentification GitHub dans une app `create-app`: <https://backstage.io/docs/getting-started/config/authentication> (code de la page de connexion du nouveau système frontend, module backend, utilisateur dans `org.yaml`).
- Fournisseur GitHub: <https://backstage.io/docs/auth/github/provider> (format de l'URL de callback, bloc de configuration, résolveurs intégrés, `userIdMatchingUserEntityAnnotation` recommandé).
- Authentification en général: <https://backstage.io/docs/auth/> (configuration par environnement, pas d'invité en production).
- Configuration du catalogue: <https://backstage.io/docs/features/software-catalog/configuration> (locations statiques, règles, entités orphelines).
