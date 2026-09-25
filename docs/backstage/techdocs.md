---
title: TechDocs
description: Comment cette documentation est fabriquée et affichée dans Backstage
icon: material/book-open-variant
status: review
createdAt: 2026-09-24
modifyAt: 2026-09-25
todo: []
---

# TechDocs

> Comment cette documentation est fabriquée et affichée dans Backstage.

Déployé et vérifié le 2026-09-24 (commits `4f0e9e5` et `586cecb`). La doc s'affiche sur la fiche du composant `backstage` (onglet "Docs") et dans la recherche.

## Overview

- Les pages sont des fichiers Markdown dans `docs/`. La navigation est dans `mkdocs.yml` pour Backstage, et dans `zensical.toml` pour l'aperçu local (voir [Configuration](../zensical/configuration.md)).
- C'est **Backstage lui-même** qui fabrique les pages: il lit `docs/` sur GitHub, les transforme en site avec MkDocs, puis les affiche.
- Modifier la doc = un push sur `main`. Pas de rebuild de l'image: `docs/**` et `mkdocs.yml` sont dans le `paths-ignore` du workflow.

Deux décisions prises le 2026-09-24: la doc se lit **dans Backstage**, et c'est **Backstage qui la fabrique** (`builder: local`, `runIn: local`), sans CI ni stockage externe.

## How it works

```text
push sur main ──▶ GitHub: docs/*.md + mkdocs.yml
                          │
visite de l'onglet Docs ──┤
                          ▼
             Backstage (conteneur): télécharge docs/, lance MkDocs
                          │  (mkdocs-techdocs-core installé dans l'image)
                          ▼
             pages rangées dans le conteneur (publisher: local), puis affichées
```

- La fiche `backstage` (`catalog-info.yaml` à la racine du repo) porte l'annotation `backstage.io/techdocs-ref: dir:.`: la doc est dans le même repo que la fiche.
- À chaque visite, Backstage vérifie si la doc a changé sur GitHub et la régénère au besoin. La première visite après un changement prend quelques secondes.
- Les pages générées sont rangées dans le conteneur, sans volume: elles sont perdues quand le conteneur est recréé (`sb install mod-backstage`) et régénérées à la visite suivante.

## Changes

Installation de Python et du générateur dans l'image, avant `USER node`, comme le décrit la doc officielle:

```dockerfile title="packages/backend/Dockerfile"
# TechDocs generator (techdocs.generator.runIn: local), must run before `USER node`.
# See https://backstage.io/docs/features/techdocs/getting-started
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
# Pinned to the version tested locally, bump deliberately (mkdocs-material keeps MkDocs < 2)
RUN pip3 install --no-cache-dir mkdocs-techdocs-core==1.7.1
```

La version de `mkdocs-techdocs-core` est fixée (1.7.1) pour que deux constructions de l'image donnent le même résultat. Elle installe MkDocs 1.6.1 et mkdocs-material 9.7.7, qui interdit MkDocs 2.0 (voir [MkDocs and Zensical](#mkdocs-and-zensical)). L'image grossit (Python et MkDocs): c'est le prix d'une génération sans stockage externe.

Le générateur tourne dans le conteneur, qui n'a pas Docker:

```yaml title="app-config.yaml"
techdocs:
  builder: 'local' # Alternatives - 'external'
  generator:
    runIn: 'local'
  publisher:
    type: 'local' # Alternatives - 'googleGcs' or 'awsS3'. Read documentation for using alternatives.
```

Autres fichiers touchés:

- **`mkdocs.yml`** (racine du repo): nom du site, navigation, plugin `techdocs-core`. MkDocs exclut toujours un dossier `docs/templates/`, réservé aux gabarits de thème: la ligne `exclude_docs: !/templates/` le réintègre, pour que la catégorie Templates soit publiée.
- **`catalog-info.yaml`**: la fiche du repo, avec l'annotation `backstage.io/techdocs-ref` (voir [Settings](settings.md#catalog)).
- **`catalog/all.yaml`**: le sommaire principal du catalogue, qui inscrit la fiche du repo (voir [Catalog](catalog.md)).
- **`.github/workflows/docker-publish.yml`**: `docs/**`, `mkdocs.yml` et `catalog-info.yaml` sont dans le `paths-ignore`.

## Checks

Vérifié en local le 2026-09-24:

- `mkdocs build` avec `mkdocs-techdocs-core` 1.7.1: OK, sans lien cassé.
- Backend lancé avec la config locale, le générateur dans le `PATH`, et un token d'accès de test (`backend.auth.externalAccess`, fichier de config temporaire hors du repo): la doc de la fiche `backstage` est générée et servie.

Vérifié après déploiement le 2026-09-24: pipeline verte (3 min 28, contre 2 min 17 avant, à cause de Python et MkDocs), puis `sb install mod-backstage`. L'onglet Docs de la fiche `backstage` affiche cette documentation. Une nouvelle page, ajoutée par un push qui ne touchait que `docs/` et `mkdocs.yml`, est apparue sans pipeline ni redéploiement.

## MkDocs and Zensical

Point fait le 2026-09-24:

- **MkDocs 1.x n'est plus maintenu** (dernière version, 1.6.1, en août 2024). **MkDocs 2.0** est une réécriture qui supprime le système de plugins: TechDocs (`techdocs-core` est un plugin) et mkdocs-material ne fonctionnent pas avec.
- **Zensical** est le successeur de mkdocs-material, créé par la même équipe. Il lit les fichiers `mkdocs.yml` existants.
- **Côté Backstage**: la discussion officielle est l'[RFC #33990](https://github.com/backstage/backstage/issues/33990). La proposition concrète est la [PR #35322](https://github.com/backstage/backstage/pull/35322) (pas encore acceptée): ajouter Zensical comme second moteur de TechDocs, en trois étapes. La première étape a commencé le 2026-09-18 dans la [PR #35781](https://github.com/backstage/backstage/pull/35781), en brouillon.

Pour ce repo:

- **Aujourd'hui, rien à changer.** La version fixée installe MkDocs 1.6.1 et bloque MkDocs 2: l'image ne peut pas récupérer MkDocs 2 par accident.
- **Préparer la migration**: garder une doc en Markdown standard, sans plugin MkDocs supplémentaire.
- **Plus tard**: quand Backstage proposera Zensical comme moteur TechDocs, changer de moteur (config et image).

## Editing

1. Écrire ou modifier un fichier dans `docs/`, en suivant [Authoring](../zensical/authoring.md) et [Rules](../zensical/rules.md).
2. Pour une nouvelle page, l'ajouter à la navigation dans `mkdocs.yml` et dans `zensical.toml`.
3. Vérifier avec l'aperçu local (voir [Configuration](../zensical/configuration.md#local-preview)).
4. Pousser sur `main`. Pas de pipeline, pas de redéploiement: la doc est régénérée à la visite suivante de l'onglet Docs.

## Sources

- Mise en place de TechDocs: <https://backstage.io/docs/features/techdocs/getting-started>
- [RFC #33990](https://github.com/backstage/backstage/issues/33990), [PR #35322](https://github.com/backstage/backstage/pull/35322), [PR #35781](https://github.com/backstage/backstage/pull/35781), [#32815](https://github.com/backstage/backstage/issues/32815), [#34329](https://github.com/backstage/backstage/issues/34329), [mkdocs-techdocs-core#341](https://github.com/backstage/mkdocs-techdocs-core/issues/341), [radiorabe/actions#226](https://github.com/radiorabe/actions/issues/226)
