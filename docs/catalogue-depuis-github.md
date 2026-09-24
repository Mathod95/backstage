# Données du catalogue lues depuis GitHub

Principe retenu le 2026-09-24: **tout ce qui est de la donnée (utilisateurs, groupes, templates) est lu sur GitHub au moment de l'exécution, et non copié dans l'image.** Ajouter un utilisateur ou modifier un template se fait par un simple push sur `main`, sans reconstruire ni redéployer l'image. Le code et la configuration (`app-config*.yaml`) restent dans l'image.

Statut: **déployé et vérifié le 2026-09-24** (commit `8b4d626`). Reste à tester l'ajout d'une entité sans rebuild (voir Vérification).

## Ce qui est lu où

| Élément | Où il vit | Comment il arrive dans Backstage | Changement = rebuild ? |
|---|---|---|---|
| Code (`packages/`) | Image | Compilé dans l'image | Oui |
| Configuration (`app-config*.yaml`) | Image | Lue au démarrage | Oui |
| Utilisateurs et groupes (`catalog/`) | Repo GitHub | Location `type: url` du catalogue | Non |
| Templates (`templates/`, à venir) | Repo GitHub | Location `type: url` du catalogue | Non |
| Secrets | Plateforme (Inventory Saltbox pour l'instant) | Variables d'environnement | Non, redéploiement seulement |

Pourquoi la configuration reste dans l'image, alors que Backstage sait la charger depuis une URL (`--config https://...`, option `remote` de `@backstage/config-loader`, vérifié dans `node_modules`):
- ce n'est pas actif par défaut, il faut modifier le code du backend;
- la configuration dépend du code compilé (par exemple `auth.providers.github` n'a de sens que si le module GitHub est dans l'image): les versionner ensemble évite les décalages;
- la base de données, les fournisseurs d'authentification et une bonne partie des plugins ne lisent leur configuration qu'au démarrage, un rechargement à chaud ne suffirait pas;
- elle change rarement, contrairement aux utilisateurs et aux templates.

## Changements appliqués

**`app-config.production.yaml`**: la location du catalogue passe de `type: file` à `type: url`:

```yaml
catalog:
  locations:
    - type: url
      target: https://github.com/Mathod95/backstage/blob/main/catalog/org.yaml
      rules:
        - allow: [User, Group]
```

**`app-config.yaml`** (développement local) garde `type: file` vers `../../catalog/org.yaml`: en local, on teste ses modifications avant de les pousser.

**`packages/backend/Dockerfile`**: la ligne `COPY --chown=node:node catalog ./catalog` est retirée, le catalogue n'est plus dans l'image.

**`.github/workflows/docker-publish.yml`**: `catalog/**` et `templates/**` rejoignent `**.md` dans `paths-ignore`. Un push qui ne touche que ces dossiers ne reconstruit pas l'image. Un push mixte (code et catalogue) la reconstruit normalement.

## Fonctionnement

- Le catalogue relit périodiquement chaque location (toutes les 100 à 150 secondes par défaut). Un changement poussé sur `main` apparaît donc en quelques minutes, sans action.
- Si GitHub est injoignable, les entités déjà connues restent dans Postgres: la connexion des utilisateurs existants continue de fonctionner.
- Lors du premier déploiement de ce changement, les entités de l'ancienne location `file` deviennent orphelines et sont supprimées, puis recréées par la location `url`. La connexion peut échouer pendant quelques minutes le temps que le catalogue se stabilise.
- Le repo est public: `catalog/org.yaml` est lisible par tous. Il ne doit contenir que des informations publiques (identifiant GitHub, `node_id`), jamais de secret.

## Organisation: un seul catalogue, plusieurs sommaires

Il n'y a qu'**un seul catalogue** par instance Backstage: c'est l'annuaire de tout ce qu'elle connaît (personnes, équipes, projets, templates...). On ne crée pas un catalogue Crossplane, un catalogue ArgoCD, etc. On range plutôt les choses à deux niveaux:

1. **Dans le repo**, avec des dossiers et des "sommaires". Un sommaire est un fichier `kind: Location` qui liste d'autres fichiers à inscrire dans le catalogue.
2. **Dans l'interface**, avec des filtres. Chaque template ou composant peut porter des `tags` (`crossplane`, `argocd`, `prometheus`) et un `spec.type`, et les pages Catalog et Create permettent de filtrer dessus. Plus tard, les entités `System` et `Domain` pourront regrouper les éléments par thème.

Arborescence prévue:

```
catalog/
├── all.yaml              ← sommaire racine, le seul connu de app-config
├── org.yaml              ← personnes et équipes
templates/
├── crossplane.yaml       ← sommaire des templates Crossplane
├── argocd.yaml           ← sommaire des templates ArgoCD
├── prometheus.yaml       ← ...
├── create-vpc/
│   ├── template.yaml     ← le template (formulaire + étapes)
│   └── skeleton/         ← fichiers modèles, lus par le template lui-même
└── ...
```

Le sommaire racine `catalog/all.yaml` pointe vers `org.yaml` et vers les sommaires de `templates/`. Chaque sommaire de thème liste ses templates:

```yaml
# catalog/all.yaml
apiVersion: backstage.io/v1alpha1
kind: Location
metadata:
  name: root
spec:
  targets:
    - ./org.yaml
    - ../templates/crossplane.yaml
```

```yaml
# templates/crossplane.yaml
apiVersion: backstage.io/v1alpha1
kind: Location
metadata:
  name: templates-crossplane
spec:
  targets:
    - ./create-vpc/template.yaml
    - ./create-subnet-pub/template.yaml
```

Les chemins de `targets` sont relatifs au fichier qui les contient, donc à son URL GitHub. Les skeletons ne sont jamais listés dans un sommaire: le template les récupère lui-même avec `fetch:template` et un chemin relatif (`url: ./skeleton`).

Pourquoi ce modèle: `app-config.production.yaml` ne pointe qu'**une seule fois** vers `catalog/all.yaml`. Ajouter un template ou un thème revient à ajouter une ligne dans un sommaire et à pousser, sans toucher à la configuration, donc sans reconstruire l'image. Le changement de `app-config.production.yaml` pour passer de `org.yaml` à `all.yaml` (avec les règles `allow: [Location, User, Group, Template]`) coûte un dernier rebuild, à faire au plus tard avec le premier template.

Alternative écartée pour l'instant: le module de découverte GitHub (`@backstage/plugin-catalog-backend-module-github`) scanne le repo et inscrit tout ce qui correspond à un motif comme `templates/*/template.yaml`, sans sommaire à tenir à jour. Il demande d'ajouter un module au backend (un rebuild) et un peu de config. Les sommaires suffisent tant que les templates se comptent en dizaines.

## Token GitHub (`GITHUB_TOKEN`)

Sans token, Backstage lit GitHub en anonyme (la doc officielle: "If it is not supplied, anonymous access will be used"). L'API GitHub limite alors à 60 requêtes par heure et par IP, et chaque location relue toutes les 2 minutes environ en consomme une trentaine par heure. Ça passe pour `org.yaml` seul, mais pas une fois les templates ajoutés. Il faut donc fournir un token, via la variable `GITHUB_TOKEN` déjà prévue par `integrations.github` dans `app-config.yaml`.

Token à créer sur <https://github.com/settings/personal-access-tokens/new> (fine-grained):

| Champ | Valeur |
|---|---|
| Token name | `backstage-catalog-read` |
| Expiration | No expiration (choix du 2026-09-24: lecture seule de données publiques, et une expiration ne ferait que repasser Backstage en anonyme) |
| Repository access | Public repositories (accès en lecture seule aux repos publics) |
| Permissions | Aucune à ajouter |

La doc Backstage ne parle que des tokens classiques (scope `repo`), un token fine-grained en lecture sur les repos publics suffit pour lire des fichiers d'un repo public. Si un jour le repo devient privé, il faudra passer à "Only select repositories" avec `Contents: Read-only`.

Ce token sert aussi à l'intégration GitHub du scaffolder. Les templates prévus demandent le token Git de l'utilisateur via un champ `Secret` au moment de l'exécution, ils ne dépendent donc pas de ce token en écriture.

Ajout sur l'hôte Saltbox (spécifique à cette plateforme, voir [retirer-exemples-et-invite.md](retirer-exemples-et-invite.md#ou-vivent-les-identifiants)):

```bash
INV=/srv/git/saltbox/inventories/host_vars/localhost.yml
cp "$INV" "$INV.bak-$(date +%F-%H%M)"
read -rsp 'GitHub token: ' GH_TOKEN; echo
sed -i "/^backstage_role_docker_envs_custom:/a\  GITHUB_TOKEN: \"$GH_TOKEN\"" "$INV"
unset GH_TOKEN
grep -n -A6 '^backstage_role_docker_envs_custom:' "$INV" | sed -E 's/((SECRET|TOKEN): ").*"/\1***"/'
```

Token `backstage-catalog-read` créé le 2026-09-24, sans expiration, et ajouté à l'Inventory de l'hôte. En cas de fuite, le révoquer sur <https://github.com/settings/personal-access-tokens> et en créer un nouveau: au pire, il donne accès en lecture à ce qui est déjà public.

## Vérification

Faite en local le 2026-09-24: backend démarré avec la location `url` vers `main`, les logs du catalogue montrent `Processing user:default/mathod` et `Processing group:default/admins`, sans erreur de lecture.

Après déploiement, le 2026-09-24: la connexion GitHub fonctionne avec le catalogue lu depuis GitHub.

Reste à faire:
- ajouter un groupe de test dans `catalog/org.yaml`, pousser: la pipeline ne se déclenche pas, et le groupe apparaît dans le catalogue en quelques minutes. Le retirer ensuite.

## Sources

- Locations du catalogue et entités orphelines: <https://backstage.io/docs/features/software-catalog/configuration>
- Intégration GitHub, token optionnel: <https://backstage.io/docs/integrations/github/locations>
