# TechDocs: la documentation dans Backstage

Mise en place le 2026-09-24. Statut: **déployé et vérifié le 2026-09-24** (commits `4f0e9e5` et `586cecb`).

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

La version de `mkdocs-techdocs-core` est fixée (1.7.1, celle testée en local) pour que deux constructions de l'image donnent le même résultat. Elle installe MkDocs 1.6.1 et mkdocs-material 9.7.7, qui interdit MkDocs 2.0 (une réécriture incompatible avec les plugins, voir "Avenir de MkDocs et Zensical" plus bas). Monter la version volontairement, après un test. L'image grossit (Python et MkDocs): c'est le prix d'une génération sans stockage externe.

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

## Avenir de MkDocs et Zensical

Point fait le 2026-09-24 à partir des discussions GitHub listées plus bas.

- **MkDocs 1.x n'est plus maintenu** (dernière version, 1.6.1, en août 2024). **MkDocs 2.0** est une réécriture qui supprime le système de plugins: TechDocs (`techdocs-core` est un plugin) et mkdocs-material ne fonctionnent pas avec.
- **Zensical** est le successeur de mkdocs-material, créé par la même équipe. Il lit les fichiers `mkdocs.yml` existants pour faciliter la migration.
- **Côté Backstage**: la discussion officielle est l'[RFC #33990](https://github.com/backstage/backstage/issues/33990) "Exploring Zensical as the Next TechDocs Documentation Engine". Les autres tickets ([#32815](https://github.com/backstage/backstage/issues/32815), [#34329](https://github.com/backstage/backstage/issues/34329), [mkdocs-techdocs-core#341](https://github.com/backstage/mkdocs-techdocs-core/issues/341)) ont été fermés en renvoyant vers elle. La proposition concrète est la [PR #35322](https://github.com/backstage/backstage/pull/35322) (ouverte, pas encore acceptée): ajouter Zensical comme second moteur de TechDocs, en trois étapes (préparer le terrain sans rien changer, ajouter Zensical, puis en faire le moteur par défaut). La première étape a commencé le 2026-09-18 dans la [PR #35781](https://github.com/backstage/backstage/pull/35781), en brouillon.
- **Exemple d'un autre projet**: [radiorabe/actions#226](https://github.com/radiorabe/actions/issues/226) publie déjà sa doc avec Zensical sur GitHub Pages, garde le nom `mkdocs.yml`, et laisse son Backstage sur MkDocs en attendant.

Ce que ça veut dire pour ce repo:
- **Aujourd'hui, rien à changer.** La version fixée (`mkdocs-techdocs-core==1.7.1`) installe MkDocs 1.6.1 et mkdocs-material 9.7.7, qui interdit MkDocs 2. L'image ne peut donc pas récupérer MkDocs 2 par accident. MkDocs 1.6.1 n'évolue plus, mais il fonctionne.
- **Préparer la migration**: garder une doc simple, en Markdown standard, sans plugin MkDocs supplémentaire. Plus la doc est simple, plus le passage à Zensical sera facile.
- **Plus tard**: quand Backstage proposera Zensical comme moteur TechDocs, changer de moteur (config et image). Le skill `create-docs` (Zensical) pourra alors resservir.

## Modifier la documentation

1. Écrire ou modifier un fichier dans `docs/`.
2. Pour une nouvelle page, l'ajouter à `nav` dans `mkdocs.yml`.
3. Pousser sur `main`. Pas de pipeline, pas de redéploiement.
4. Ouvrir l'onglet Docs de la fiche `backstage`: la doc est régénérée à la visite.

Pour vérifier en local avant de pousser: `python3 -m venv .venv && .venv/bin/pip install mkdocs-techdocs-core==1.7.1 && .venv/bin/mkdocs serve`.

## Vérification après déploiement

Le 2026-09-24: pipeline verte (3 min 28, contre 2 min 17 avant, à cause de l'installation de Python et MkDocs), puis `sb install mod-backstage`. Le catalogue affiche le composant `backstage` avec le propriétaire `admins`, son onglet Docs affiche cette documentation, et la connexion fonctionne.

Reste à tester: modifier une page et pousser, vérifier qu'aucune pipeline ne part et que la modification apparaît dans Backstage.

## Sources

- Mise en place de TechDocs: <https://backstage.io/docs/features/techdocs/getting-started>
- Règles du catalogue avec `pattern`: commentaire de `DefaultCatalogRulesEnforcer` dans `node_modules/@backstage/plugin-catalog-backend/dist/ingestion/CatalogRules.cjs.js`
