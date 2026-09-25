---
title: Home
description: Documentation du Backstage de backstage.mathod.fr et liste des tâches
icon: material/home
status: draft
createdAt: 2026-09-24
modifyAt: 2026-09-25
todo: []
---

# Backstage Mathod

> Documentation du Backstage de [backstage.mathod.fr](https://backstage.mathod.fr): ce qui a été fait, pourquoi, et ce qui reste à faire.

Chaque changement apporté au projet y est documenté. Le code est sur GitHub: [Mathod95/backstage](https://github.com/Mathod95/backstage). L'image est publiée sur `ghcr.io/mathod95/backstage` et déployée sur l'hôte Saltbox par le rôle `backstage` du repo [Mathod95/saltbox](https://github.com/Mathod95/saltbox).

## Editing the docs

Les règles pour créer et écrire une page sont dans [Authoring](zensical/authoring.md) et [Rules](zensical/rules.md), l'aperçu local et la config Zensical dans [Configuration](zensical/configuration.md).

Les pages sont des fichiers Markdown dans `docs/`, la navigation est dans `mkdocs.yml` et `zensical.toml` à la racine du repo. Un push sur `main` suffit: Backstage relit la doc sur GitHub et la régénère, sans reconstruire l'image.

## Todo

Liste condensée de tout ce qui reste à faire ou à décider. Contexte et détails dans [historique-ancienne-instance.md](backstage/previous-instance.md). Cette documentation s'affiche dans Backstage (TechDocs), voir [techdocs.md](backstage/techdocs.md). Les lignes "Décider" sont des choix à faire avant d'agir.

### Done

- [x] Backstage stock généré (`create-app`), build de production et image validés en local
- [x] Pipeline GitHub Actions qui publie `ghcr.io/mathod95/backstage` (public)
- [x] Rôle Saltbox `backstage` (Postgres via le rôle natif, Authelia devant), lint propre, déployé et fonctionnel
- [x] `baseUrl` publiques dans `app-config.production.yaml`
- [x] Rôle `tracearr` récupéré depuis Sandbox et ajouté au repo `saltbox`
- [x] Skill `saltbox/create-custom-role` et script de lint

### 1. Security and authentication

Prioritaire.

Procédure détaillée pour GitHub OAuth, le retrait de l'invité et des exemples: [retirer-exemples-et-invite.md](backstage/github-sign-in.md).

- [x] Activer GitHub OAuth (application OAuth GitHub, provider `github`, page de connexion, résolveur): déployé et vérifié le 2026-09-24
- [x] Photo de profil GitHub bloquée par la CSP: `img-src` corrigé dans `app-config.yaml`, déployé et vérifié le 2026-09-24
- [x] Ajouter les utilisateurs au catalogue avec l'annotation `github.com/user-id` (le `node_id`, pas l'id numérique): `catalog/org.yaml`, utilisateur `mathod`, groupe `admins`
- [x] Une fois OAuth validé: retirer la ligne `guest` de l'Inventory
- [x] Décider de garder ou non Authelia devant Backstage: on le garde (décidé le 2026-09-24), double barrière avec GitHub OAuth. Spécifique à l'hôte Saltbox
- [x] Une fois OAuth validé: remplacer `auth.providers.guest` par `github` dans `app-config.production.yaml` et retirer `plugin-auth-backend-module-guest-provider` de `packages/backend/src/index.ts`
- [x] Données du catalogue lues depuis GitHub (`catalog/` en `type: url`, hors image, hors pipeline): appliqué dans le repo, voir [catalogue-depuis-github.md](backstage/catalog.md). Token `backstage-catalog-read` (sans expiration) créé et ajouté à l'Inventory, déployé et vérifié le 2026-09-24
- [ ] Tester l'ajout d'un groupe dans `catalog/org.yaml` sans rebuild (push seul, le groupe doit apparaître en quelques minutes)
- [ ] Plus tard, **avant d'ajouter une deuxième personne** dans `catalog/org.yaml` (reporté le 2026-09-24, seul sur le projet pour l'instant): gestion des droits et des groupes
  - Remplacer la politique de permissions `allow-all`: aujourd'hui toute personne connectée a tous les droits, le groupe `admins` n'est qu'une étiquette
  - Définir les groupes (par exemple `admins` et un groupe d'utilisateurs) et qui peut faire quoi: lancer quels templates (par tag ou par thème), inscrire ou supprimer des entités du catalogue
  - Définir le modèle de propriété du catalogue: quels `System` et `Component` décrire, et quel groupe possède chacun (`spec.owner`)
  - Rappel: le propriétaire d'une fiche (`spec.owner`, par exemple `group:admins`) indique qui est responsable, il ne limite pas qui la voit. Tant que la politique est `allow-all`, toute personne connectée voit tout. Les règles pourront ensuite s'appuyer sur le propriétaire (par exemple: seul le groupe propriétaire modifie ou voit une fiche)
  - Rappel: la connexion est déjà limitée aux personnes présentes dans `catalog/org.yaml` (résolveur GitHub), et Authelia filtre en amont sur l'hôte Saltbox
- [x] ~~Configurer `backend.auth.keys`~~: pas nécessaire (vérifié le 2026-09-24 sur <https://backstage.io/docs/auth/service-to-service-auth>). C'est un réglage de l'ancien système backend. Avec le nouveau, les plugins s'authentifient entre eux automatiquement, avec des clés générées et stockées dans Postgres. Le commentaire du modèle dans `app-config.yaml` est un reste
- [ ] Plus tard, si un script ou une CI doit appeler l'API de Backstage: configurer `backend.auth.externalAccess` (token statique limité à certains plugins)
- [x] Faire tourner l'ancien secret OAuth GitHub (considéré comme compromis): nouvelle application créée, ancienne supprimée le 2026-09-24
- [ ] Réduire le token d'intégration GitHub du scaffolder (fine-grained, `Contents` et `Administration`)
- [x] Secrets uniquement en variables d'environnement, jamais dans le repo: c'est le cas pour tous les secrets (voir [Settings](backstage/settings.md#secrets))

### 2. Backstage app

- [ ] Décider: branding (titre `Mathod`, logos, page d'accueil), fait sur l'ancienne instance. Carte de tous les réglages: [settings](backstage/settings.md), [branding](backstage/personnalisation/branding.md). Page de connexion: maquette 2 retenue, voir [page de connexion](backstage/personnalisation/page-de-connexion.md)
- [x] Remplacer les valeurs par défaut du modèle dans `app-config.yaml`: `app.title` et `organization.name` valent `Mathod`, `mcpActions.name` vaut `Mathod Backstage` (2026-09-24, à vérifier au déploiement)
- [x] Remplacer le catalogue d'exemple par les vraies sources (`catalog.locations`), première étape décrite dans [retirer-exemples-et-invite.md](backstage/github-sign-in.md)
- [x] TechDocs mis en place le 2026-09-24 avec génération par Backstage lui-même (choix de l'utilisateur, plutôt que CI et stockage externe), déployé et vérifié: voir [techdocs.md](backstage/techdocs.md)
- [ ] Explorer les améliorations possibles de TechDocs: apparence (thème), addons (le paquet `@backstage/plugin-techdocs-module-addons-contrib` est déjà installé), plugins MkDocs et fonctionnalités. Attention: chaque plugin MkDocs ajouté compliquera le futur passage à Zensical
- [x] TechDocs n'était pas fonctionnel (aucune annotation `backstage.io/techdocs-ref`, `runIn: docker` sans Docker dans l'image): corrigé, voir [techdocs.md](backstage/techdocs.md)
- [x] Une fois TechDocs en place: migrer `docs-temp/` vers `docs/` avec un `mkdocs.yml` et annoter `catalog-info.yaml`
- [ ] Plus tard, si la doc grossit ou si plusieurs instances existent: passer à la génération en CI et à un stockage externe (recommandation officielle)
- [ ] Suivre l'arrivée de Zensical comme moteur TechDocs ([PR #35322](https://github.com/backstage/backstage/pull/35322), [PR #35781](https://github.com/backstage/backstage/pull/35781)) et migrer quand il sera disponible. D'ici là, garder `mkdocs-techdocs-core` fixé et la doc en Markdown simple, voir [techdocs.md](backstage/techdocs.md#mkdocs-and-zensical)
- [ ] Écrire notre propre plugin Zensical pour remplacer TechDocs (souhaité le 2026-09-24: les petits soucis visuels de TechDocs dérangent). Un plugin backend et un plugin frontend:
  - Backend: récupérer `docs/` sur GitHub pour chaque fiche, lancer `zensical build` (Zensical à installer dans l'image), stocker les pages et savoir quand les refaire, les servir uniquement aux personnes connectées, alimenter la recherche (optionnel)
  - Frontend: un onglet sur les fiches du catalogue qui affiche les pages. Soit en iframe (simple, mais apparence de Zensical et non du thème Backstage, liens et navigation à surveiller), soit intégrées comme TechDocs (le gros du travail)
  - Alternative plus légère: remplacer seulement le générateur de TechDocs par un module backend (`techdocsGeneratorExtensionPoint`, présent dans la version installée), mais l'affichage de TechDocs attend des pages MkDocs et risque de mal rendre celles de Zensical
  - Démarche: un essai dans une branche Git à part, sans toucher à `main` ni à TechDocs, testé en local d'abord (Zensical dans un environnement Python jetable), puis décision de continuer ou non. Ordre de grandeur: essai en quelques heures, équivalent complet de TechDocs sur plusieurs séances, puis entretien à chaque mise à jour de Backstage
  - À comparer avec la version officielle en cours (PR #35322 et #35781): si elle arrive avant, elle remplace ce chantier
- [ ] Décider: sauvegardes planifiées de Postgres, et tester une restauration (une sauvegarde jamais restaurée ne garantit rien)
- [ ] Décider: healthcheck du conteneur (`/.backstage/health/v1/readiness`)
- [ ] Surveillance: être prévenu quand Backstage tombe (backend, base de données, erreurs de plugins), lié au healthcheck
- [ ] CORS: `backend.cors.origin` vaut encore `http://localhost:3000` (valeur du développement local), à restreindre à l'adresse de production
- [ ] Maintenance régulière: monter la version de Backstage (`yarn backstage-cli versions:bump`) et redéployer
- [ ] Décider: épingler l'image par sha dans l'Inventory pour des déploiements reproductibles
- [ ] Vérifier la version minimale de Postgres supportée par Backstage (17-alpine choisi sans vérification)
- [x] Retirer SQLite de l'image: supprimer l'installation de `libsqlite3-dev` du `Dockerfile` et passer `better-sqlite3` en `devDependencies`: déployé et vérifié le 2026-09-24, voir [retirer-sqlite-de-l-image.md](backstage/sqlite-removal.md)
- [ ] Plus tard, pour tester l'image en local: activer l'intégration WSL de Docker Desktop pour la distribution de travail (Docker Desktop tourne sous Windows mais `/mnt/wsl/docker-desktop/cli-tools` est vide côté WSL, constaté le 2026-09-24), puis construire l'image et la lancer avec un Postgres jetable
- [ ] Ajouter un build de vérification sur les pull requests (`yarn tsc`, `yarn build:backend`, sans publication d'image)

### 3. Templates

Reprise des templates de l'ancienne instance.

- [ ] Décider: groupes API Crossplane cluster-scoped (actuels) ou namespaced `.m.` (Crossplane v2)
- [ ] Installer le provider AWS (Upbound) et son `ProviderConfig` sur le cluster de test
- [ ] Valider les 9 skeletons contre les vraies CRD AWS
- [x] Créer le sommaire racine `catalog/all.yaml` et y faire pointer `app-config.production.yaml` (fait avec TechDocs le 2026-09-24)
- [ ] Un sommaire par thème dans `templates/`, ajouté à `catalog/all.yaml` (voir [catalogue-depuis-github.md](backstage/catalog.md#organization))
- [ ] Templates enregistrés par URL GitHub dans `templates/`, pas copiés dans l'image (décidé le 2026-09-24, même principe que [catalogue-depuis-github.md](backstage/catalog.md)): location `type: url` avec `allow: [Template]`. `templates/**` est déjà dans le `paths-ignore` du workflow
- [ ] Tester le comportement des chemins relatifs `../../skeletons/...` avec un enregistrement par URL
- [ ] Reprendre les templates un par un: `create-vpc`, `create-internet-gateway`, `create-route-table`, `create-subnet-pub`, `create-subnet-priv`, `create-security-group`, `create-eks-cluster`, `stack-network`
- [ ] Reprendre `RegionPicker` (dépend des templates)
- [ ] Décider: garder ou non `basic-repo` (template de test du token)
- [ ] Vérifier la position du champ `description` de `publish:gitlab` si GitLab est utilisé
- [ ] Tester la condition de concurrence connue de `catalog:register` (backstage#8597)

### 4. Crossplane and ArgoCD platform

Le projet d'origine.

- [ ] Première Composition en XR namespaced (sans Claim), valider `provider-helm`
- [ ] Composition de création d'EKS
- [ ] Bootstrap ArgoCD chez le client (`provider-helm` et `provider-kubernetes`)
- [ ] Concevoir la propagation des `external-name` entre bootstrap éphémère et Crossplane permanent (fichier de sortie committé)
- [ ] Vrai template `new-client` (nom, région, topologie VPC, fournisseur Git, add-ons)
- [ ] Templates satellites (`new-iam-role`)
- [ ] Prometheus et add-ons dans le GitOps client
- [ ] Décider: enregistrement catalogue par client (repo d'inventaire et Discovery Provider, `catalog:register`, ou rien pour le MVP)
- [ ] Décider: fourniture du rôle IAM OIDC au client (CloudFormation ou Crossplane)
- [ ] Mettre à jour le brief initial (contredit les décisions prises)
- [ ] Optionnel, hors MVP: plugin Crossplane TeraSky, fournisseur d'identité local Dex

### 5. Saltbox host and roles

- [ ] Décider: déployer `tracearr` sur l'hôte (`sb update`, copie du rôle, enregistrement, déploiement, tag `tracearr-claim`)
- [ ] Vérifier `sb install mod-<tag>` dans le binaire `sb` (pour l'instant tiré du README de `saltbox_mod`)
- [ ] Autres plateformes (Docker Desktop, Kubernetes), le moment venu: définir comment fournir les variables secrètes (`AUTH_GITHUB_CLIENT_ID`, `AUTH_GITHUB_CLIENT_SECRET`, `POSTGRES_*`), surcharger `app.baseUrl` et `backend.baseUrl` (fixées à `backstage.mathod.fr` dans `app-config.production.yaml`), ajouter la Redirect URI correspondante dans l'application OAuth GitHub, pas d'Authelia côté Kubernetes. L'Inventory Saltbox est spécifique à l'hôte actuel

### 6. Skills and tooling

Dans le dépôt `Mathod95/skills`.

- [ ] Réécrire proprement le skill `create-docs` (zensical)
- [ ] Décider: créer le skill `crossplane/manage-lifecycle` (candidat noté)
- [ ] Compléter `saltbox/create-custom-role` avec les retours des prochains vrais déploiements
- [ ] Optimiser la `description` de `learn-a-tech` avec `skill-creator` après quelques usages réels
- [ ] Fixer une règle numérique de péremption pour les fichiers de référence
