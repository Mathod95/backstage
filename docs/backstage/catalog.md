---
title: Catalog
description: Les données du catalogue lues sur GitHub, sans reconstruire l'image
icon: material/database-search
status: review
createdAt: 2026-09-24
modifyAt: 2026-09-25
todo:
  - "[ ] Tester l'ajout d'un groupe dans catalog/org.yaml sans rebuild"
---

# Catalog

> Les données du catalogue (utilisateurs, groupes, templates) sont lues sur GitHub, sans reconstruire l'image.

Déployé et vérifié le 2026-09-24. Ajouter un utilisateur ou modifier un template se fait par un simple push sur `main`, sans reconstruire ni redéployer l'image. Le code et la configuration (`app-config*.yaml`) restent dans l'image.

## What lives where

| Element                 | Where       | How it reaches Backstage  | Rebuild |
| ----------------------- | ----------- | ------------------------- | ------- |
| Code (`packages/`)      | Image       | Compilé dans l'image      | Oui     |
| Configuration           | Image       | Lue au démarrage          | Oui     |
| Utilisateurs et groupes | Repo GitHub | Location `type: url`      | Non     |
| Templates (à venir)     | Repo GitHub | Location `type: url`      | Non     |
| Secrets                 | Plateforme  | Variables d'environnement | Non     |

Les utilisateurs et groupes sont dans `catalog/`, les templates iront dans `templates/`. Les secrets viennent de l'Inventory Saltbox pour l'instant: un changement demande un redéploiement, pas un rebuild.

La configuration reste dans l'image, alors que Backstage sait la charger depuis une URL (`--config https://...`, option `remote` de `@backstage/config-loader`):

- ce n'est pas actif par défaut, il faut modifier le code du backend;
- la configuration dépend du code compilé (par exemple `auth.providers.github` n'a de sens que si le module GitHub est dans l'image): les versionner ensemble évite les décalages;
- la base de données, la connexion et une bonne partie des plugins ne lisent leur configuration qu'au démarrage;
- elle change rarement, contrairement aux utilisateurs et aux templates.

## Configuration

En production, le catalogue a un seul point d'entrée, lu sur GitHub:

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

- **La règle avec `pattern`** autorise les utilisateurs, groupes et templates **uniquement** s'ils viennent de ce repo, sur `main`. Une règle donnée directement sur une location ne s'appliquerait qu'au fichier visé, pas aux fichiers listés par un sommaire (vérifié dans le code du catalogue, `CatalogRules.cjs.js`).
- **En local**, `app-config.yaml` lit les mêmes fichiers sur le disque (`type: file`, `../../catalog/all.yaml`), pour tester avant de pousser.

Le `Dockerfile` ne copie pas `catalog/`, et un push qui ne touche que les données ne relance pas la pipeline:

```yaml title=".github/workflows/docker-publish.yml"
    paths-ignore:
      - '**.md'
      - 'catalog/**'
      - 'templates/**'
      - 'docs/**'
      - 'mkdocs.yml'
      - 'catalog-info.yaml'
      - 'zensical.toml'
      - 'overrides/**'
```

## Behavior

- Le catalogue relit périodiquement chaque location (toutes les 100 à 150 secondes par défaut). Un changement poussé sur `main` apparaît en quelques minutes.
- Si GitHub est injoignable, les entités déjà connues restent dans Postgres: la connexion des utilisateurs existants continue de fonctionner.
- Quand une location change (par exemple de `type: file` à `type: url`), les anciennes entités deviennent orphelines et sont supprimées, puis recréées: la connexion peut échouer quelques minutes.
- Le repo est public: `catalog/org.yaml` ne doit contenir que des informations publiques (identifiant GitHub, `node_id`), jamais de secret.

## Organization

Il n'y a qu'**un seul catalogue** par instance: l'annuaire de tout ce qu'elle connaît. On range les choses à deux niveaux:

1. **Dans le repo**, avec des dossiers et des "sommaires". Un sommaire est un fichier `kind: Location` qui liste d'autres fichiers à inscrire.
2. **Dans l'interface**, avec des filtres: chaque template ou composant peut porter des `tags` (`crossplane`, `argocd`...) et un `spec.type`. Plus tard, les entités `System` et `Domain` pourront regrouper les éléments par thème.

Le sommaire principal, le seul connu de la configuration:

```yaml title="catalog/all.yaml"
---
# Root of the catalog: the only file referenced from app-config. Add new files here
# (users, components, template summaries) so that no config change or image rebuild is needed.
# https://backstage.io/docs/features/software-catalog/descriptor-format#kind-location
apiVersion: backstage.io/v1alpha1
kind: Location
metadata:
  name: root
  description: Root of the Backstage Mathod catalog
spec:
  targets:
    - ./org.yaml
    - ../catalog-info.yaml
    - ../templates/github.yaml
```

Arborescence des templates (le sommaire `github.yaml` existe, les autres sont prévus):

```text
catalog/
├── all.yaml              ← sommaire principal
├── org.yaml              ← personnes et équipes
templates/
├── github.yaml           ← sommaire des templates GitHub
├── github/
│   └── create-repo/
│       ├── template.yaml ← le template (formulaire + étapes)
│       ├── mkdocs.yml    ← sa doc
│       └── docs/
├── crossplane.yaml       ← sommaire des templates Crossplane (prévu)
└── crossplane/
    └── create-vpc/
        ├── template.yaml
        └── skeleton/     ← fichiers modèles, lus par le template lui-même
```

Chaque sommaire de thème sera ajouté à `targets` dans `catalog/all.yaml`. Les chemins de `targets` sont relatifs au fichier qui les contient, donc à son URL GitHub. Les skeletons ne sont jamais listés: le template les récupère lui-même avec `fetch:template` et un chemin relatif (`url: ./skeleton`).

Ajouter un template ou un thème revient donc à ajouter une ligne dans un sommaire et à pousser, sans toucher à la configuration.

Autre possibilité, non retenue pour l'instant: le module de découverte GitHub (`@backstage/plugin-catalog-backend-module-github`) inscrit tout ce qui correspond à un motif comme `templates/*/template.yaml`. Il demande un module de plus dans le backend (un rebuild). Les sommaires suffisent tant que les templates se comptent en dizaines.

## GitHub token

Sans token, Backstage lit GitHub en anonyme, limité à 60 requêtes par heure. Chaque location relue toutes les 2 minutes environ en consomme une trentaine par heure: ça passe pour un fichier, pas une fois les templates ajoutés. D'où la variable `GITHUB_TOKEN` (voir [Settings](settings.md#integrations)).

Token créé sur <https://github.com/settings/personal-access-tokens/new> (fine-grained):

| Field             | Value                                                 |
| ----------------- | ----------------------------------------------------- |
| Token name        | `backstage-catalog-read`                              |
| Expiration        | No expiration                                         |
| Repository access | Public repositories (lecture seule des repos publics) |
| Permissions       | Aucune à ajouter                                      |

- **Sans expiration**: il ne donne accès en lecture qu'à des données déjà publiques. Une expiration ne ferait que repasser Backstage en anonyme.
- **Si le repo devient privé**, il faudra passer à "Only select repositories" avec `Contents: Read-only`.
- **En cas de fuite**, le révoquer sur <https://github.com/settings/personal-access-tokens> et en créer un nouveau.

Ajout sur l'hôte Saltbox (spécifique à cette plateforme):

```bash
INV=/srv/git/saltbox/inventories/host_vars/localhost.yml
cp "$INV" "$INV.bak-$(date +%F-%H%M)"
read -rsp 'GitHub token: ' GH_TOKEN; echo
sed -i "/^backstage_role_docker_envs_custom:/a\  GITHUB_TOKEN: \"$GH_TOKEN\"" "$INV"
unset GH_TOKEN
grep -n -A6 '^backstage_role_docker_envs_custom:' "$INV" | sed -E 's/((SECRET|TOKEN): ").*"/\1***"/'
```

## Checks

- Vérifié en local le 2026-09-24: les logs du catalogue montrent `Processing user:default/mathod` et `Processing group:default/admins`, sans erreur de lecture.
- Vérifié après déploiement le 2026-09-24: la connexion GitHub fonctionne avec le catalogue lu sur GitHub.
- Reste à tester: ajouter un groupe dans `catalog/org.yaml` et pousser. La pipeline ne doit pas partir, et le groupe doit apparaître en quelques minutes.

## Sources

- Locations du catalogue et entités orphelines: <https://backstage.io/docs/features/software-catalog/configuration>
- Intégration GitHub, accès anonyme: <https://backstage.io/docs/integrations/github/locations>
- Règles avec `pattern`: `node_modules/@backstage/plugin-catalog-backend/dist/ingestion/CatalogRules.cjs.js`
