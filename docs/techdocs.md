# TechDocs: la documentation dans Backstage

Mise en place le 2026-09-24. Statut: **appliqué dans le repo et vérifié en local, pas encore déployé**.

Cette documentation s'affiche dans Backstage, sur la fiche du composant `backstage` (onglet "Docs"), et dans la recherche. Avant, elle vivait dans un dossier `docs-temp/` en attendant que TechDocs fonctionne.

## En bref

- Les pages sont des fichiers Markdown dans `docs/`, la navigation est dans `mkdocs.yml` à la racine du repo.
- C'est **Backstage lui-même** qui fabrique les pages: il lit `docs/` sur GitHub, les transforme en site avec MkDocs, puis les affiche.
- Modifier la doc = un push sur `main`. Pas de rebuild de l'image: `docs/**` et `mkdocs.yml` sont dans le `paths-ignore` du workflow.

## Choix faits

Deux questions tranchées par l'utilisateur le 2026-09-24:

| Question | Choix | Alternative écartée |
|---|---|---|
| Où lire la doc ? | Dans Backstage (TechDocs) | Un site Zensical séparé (skill `create-docs`), plus libre mais hors de Backstage, TechDocs ne sait pas lire Zensical |
| Qui fabrique les pages ? | Backstage lui-même (`builder: local`, `runIn: local`) | La CI fabrique les pages et les dépose dans un stockage (S3...), méthode recommandée par la doc officielle pour les gros volumes, mais il faut un stockage et ses identifiants |

## Comment ça marche

```
push sur main ──▶ GitHub: docs/*.md + mkdocs.yml
                          │
visite de l'onglet Docs ──┤
                          ▼
             Backstage (conteneur): télécharge docs/, lance MkDocs
                          │  (mkdocs-techdocs-core installé dans l'image)
                          ▼
             pages rangées dans le conteneur (publisher: local), puis affichées
```

- La fiche `backstage` (`catalog-info.yaml` à la racine du repo) porte l'annotation `backstage.io/techdocs-ref: dir:.`: la doc est dans le même repo que la fiche, à côté d'elle.
- À chaque visite, Backstage vérifie si la doc a changé sur GitHub et la régénère au besoin. La première visite après un changement prend quelques secondes.
- Les pages générées sont rangées dans le conteneur, sans volume: elles sont perdues quand le conteneur est recréé (`sb install mod-backstage`) et simplement régénérées à la visite suivante. Ce n'est pas un problème pour une doc de cette taille.

## Changements appliqués

**`packages/backend/Dockerfile`**: installation de Python et du générateur, avant `USER node`, comme le décrit la doc officielle:

```dockerfile
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
RUN pip3 install --no-cache-dir mkdocs-techdocs-core==1.7.1
```

La version de `mkdocs-techdocs-core` est fixée (1.7.1, celle testée en local) pour que deux constructions de l'image donnent le même résultat. Elle installe MkDocs 1.6.1 et mkdocs-material 9.7.7, qui interdit MkDocs 2.0 (une future version annoncée comme incompatible avec les plugins). Monter la version volontairement, après un test. L'image grossit (Python et MkDocs): c'est le prix d'une génération sans stockage externe.

**`app-config.yaml`**: `techdocs.generator.runIn` passe de `docker` à `local`. Le conteneur n'a pas Docker, il ne pouvait donc pas lancer l'image de génération.

**`mkdocs.yml`** (nouveau, racine du repo): nom du site, navigation, plugin `techdocs-core`.

**`docs/`**: ancien `docs-temp/`, renommé, avec une page d'accueil `index.md`.

**`catalog-info.yaml`**: la fiche du repo, restée celle du modèle (`owner: john@example.com`), est corrigée: propriétaire `group:admins`, `lifecycle: production`, annotations `github.com/project-slug` et `backstage.io/techdocs-ref`.

**`catalog/all.yaml`** (nouveau): le sommaire principal du catalogue, prévu dans [catalogue-depuis-github.md](catalogue-depuis-github.md#organisation-un-seul-catalogue-plusieurs-sommaires). Il liste `org.yaml` et `catalog-info.yaml`. La configuration ne pointe plus que vers lui: c'était le dernier rebuild prévu pour le catalogue.

**`app-config.production.yaml`**: la location pointe vers `catalog/all.yaml`, et les règles du catalogue changent:

```yaml
catalog:
  rules:
    - allow: [Component, System, API, Resource, Location]
    - allow: [Location, User, Group, Component, System, API, Resource, Template]
      locations:
        - type: url
          pattern: https://github.com/Mathod95/backstage/blob/main/**
```

Pourquoi un motif: les règles données directement sur une location de la configuration ne s'appliquent qu'au fichier visé, pas aux fichiers listés par un sommaire (vérifié dans le code du catalogue, `CatalogRules.cjs.js`, qui compare l'emplacement exact). Le motif autorise les utilisateurs, groupes et templates **uniquement** s'ils viennent de ce repo, sur `main`. Testé avec la même fonction de comparaison que le catalogue: les fichiers de `Mathod95/backstage` passent, un autre repo est refusé.

**`app-config.yaml`** (local uniquement): une seule règle globale qui autorise tous ces types, et la location pointe vers `../../catalog/all.yaml`. Ces règles sont remplacées par celles de production dans l'image.

**`.github/workflows/docker-publish.yml`**: `docs/**`, `mkdocs.yml` et `catalog-info.yaml` rejoignent le `paths-ignore`.

## Vérifications faites en local

- `mkdocs build` avec `mkdocs-techdocs-core` 1.7.1: OK, sans lien cassé.
- Backend lancé avec la config locale, le générateur dans le `PATH`, et un token d'accès de test (`backend.auth.externalAccess`, fichier de config temporaire hors du repo):
  - le catalogue contient `root` (sommaire), `mathod`, `admins` et le composant `backstage`;
  - `/api/techdocs/sync/default/component/backstage` génère et publie la doc (`"updated": true`);
  - `/api/techdocs/static/docs/default/component/backstage/index.html` répond 200.

Pas testé en local: la lecture depuis GitHub (les nouveaux fichiers n'y sont pas encore), ni l'image elle-même (pas de Docker dans l'environnement de travail). Ce sera vérifié au déploiement.

## Modifier la documentation

1. Écrire ou modifier un fichier dans `docs/`.
2. Pour une nouvelle page, l'ajouter à `nav` dans `mkdocs.yml`.
3. Pousser sur `main`. Pas de pipeline, pas de redéploiement.
4. Ouvrir l'onglet Docs de la fiche `backstage`: la doc est régénérée à la visite.

Pour vérifier en local avant de pousser: `python3 -m venv .venv && .venv/bin/pip install mkdocs-techdocs-core==1.7.1 && .venv/bin/mkdocs serve`.

## À vérifier après déploiement

- La pipeline est verte.
- Après `sb install mod-backstage`: le catalogue affiche le composant `backstage`, son onglet Docs affiche cette documentation, et la connexion fonctionne toujours (les utilisateurs passent maintenant par le sommaire `all.yaml`, la connexion peut échouer quelques minutes le temps que le catalogue se stabilise).
- Modifier une page, pousser: aucune pipeline ne part, et la modification apparaît dans Backstage.

## Sources

- Mise en place de TechDocs: <https://backstage.io/docs/features/techdocs/getting-started>
- Règles du catalogue avec `pattern`: commentaire de `DefaultCatalogRulesEnforcer` dans `node_modules/@backstage/plugin-catalog-backend/dist/ingestion/CatalogRules.cjs.js`
