# TODO

Liste condensée de tout ce qui reste à faire ou à décider. Contexte et détails dans [historique-ancienne-instance.md](historique-ancienne-instance.md). Les lignes "Décider" sont des choix à faire avant d'agir.

## Fait

- [x] Backstage stock généré (`create-app`), build de production et image validés en local
- [x] Pipeline GitHub Actions qui publie `ghcr.io/mathod95/backstage` (public)
- [x] Rôle Saltbox `backstage` (Postgres via le rôle natif, Authelia devant), lint propre, déployé et fonctionnel
- [x] `baseUrl` publiques dans `app-config.production.yaml`
- [x] Rôle `tracearr` récupéré depuis Sandbox et ajouté au repo `saltbox`
- [x] Skill `saltbox/create-custom-role` et script de lint

## 1. Sécurité et authentification (prioritaire)

Procédure détaillée pour GitHub OAuth, le retrait de l'invité et des exemples: [retirer-exemples-et-invite.md](retirer-exemples-et-invite.md).

- [x] Activer GitHub OAuth (application OAuth GitHub, provider `github`, page de connexion, résolveur): déployé et vérifié le 2026-09-24
- [x] Photo de profil GitHub bloquée par la CSP: `img-src` corrigé dans `app-config.yaml`, déployé et vérifié le 2026-09-24
- [x] Ajouter les utilisateurs au catalogue avec l'annotation `github.com/user-id` (le `node_id`, pas l'id numérique): `catalog/org.yaml`, utilisateur `mathod`, groupe `admins`
- [x] Une fois OAuth validé: retirer la ligne `guest` de l'Inventory
- [ ] Décider de garder ou non Authelia devant Backstage
- [x] Une fois OAuth validé: remplacer `auth.providers.guest` par `github` dans `app-config.production.yaml` et retirer `plugin-auth-backend-module-guest-provider` de `packages/backend/src/index.ts`
- [ ] Données du catalogue lues depuis GitHub (`catalog/` en `type: url`, hors image, hors pipeline): appliqué dans le repo, voir [catalogue-depuis-github.md](catalogue-depuis-github.md). Token `backstage-catalog-read` (sans expiration) créé et ajouté à l'Inventory, déployé et vérifié le 2026-09-24. Reste à tester l'ajout d'un groupe sans rebuild
- [ ] Remplacer la politique de permissions `allow-all` (qui peut lancer quel template)
- [ ] Configurer `backend.auth.keys`
- [ ] Faire tourner l'ancien secret OAuth GitHub (considéré comme compromis)
- [ ] Réduire le token d'intégration GitHub du scaffolder (fine-grained, `Contents` et `Administration`)
- [ ] Secrets uniquement en variables d'environnement, jamais dans le repo

## 2. Application Backstage

- [ ] Décider: branding (titre `Mathod.io`, logos, page d'accueil), fait sur l'ancienne instance
- [ ] Remplacer les valeurs par défaut du modèle dans `app-config.yaml`: `app.title` (`Scaffolded Backstage App`), `organization.name` et `mcpActions.name` (`My Company`)
- [x] Remplacer le catalogue d'exemple par les vraies sources (`catalog.locations`), première étape décrite dans [retirer-exemples-et-invite.md](retirer-exemples-et-invite.md)
- [ ] TechDocs: passer en génération CI et stockage externe (le mode `local` est déconseillé en production)
- [ ] TechDocs n'est pas fonctionnel en l'état: aucune entité n'a l'annotation `backstage.io/techdocs-ref`, `runIn: docker` suppose une CLI Docker absente de l'image, et `publisher: local` écrit dans le conteneur sans persistance
- [ ] Une fois TechDocs en place: migrer `docs-temp/` vers `docs/` avec un `mkdocs.yml` et annoter `catalog-info.yaml`
- [ ] Décider: sauvegardes planifiées de Postgres
- [ ] Décider: healthcheck du conteneur (`/.backstage/health/v1/readiness`)
- [ ] Maintenance régulière: monter la version de Backstage (`yarn backstage-cli versions:bump`) et redéployer
- [ ] Décider: épingler l'image par sha dans l'Inventory pour des déploiements reproductibles
- [ ] Vérifier la version minimale de Postgres supportée par Backstage (17-alpine choisi sans vérification)
- [ ] Retirer SQLite de l'image: supprimer l'installation de `libsqlite3-dev` du `Dockerfile` et passer `better-sqlite3` en `devDependencies`
- [ ] Ajouter un build de vérification sur les pull requests (`yarn tsc`, `yarn build:backend`, sans publication d'image)

## 3. Templates (reprise de l'ancienne instance)

- [ ] Décider: groupes API Crossplane cluster-scoped (actuels) ou namespaced `.m.` (Crossplane v2)
- [ ] Installer le provider AWS (Upbound) et son `ProviderConfig` sur le cluster de test
- [ ] Valider les 9 skeletons contre les vraies CRD AWS
- [ ] Créer le sommaire racine `catalog/all.yaml` et y faire pointer `app-config.production.yaml` (dernier rebuild pour le catalogue), puis un sommaire par thème dans `templates/` (voir [catalogue-depuis-github.md](catalogue-depuis-github.md#organisation-un-seul-catalogue-plusieurs-sommaires))
- [ ] Templates enregistrés par URL GitHub dans `templates/`, pas copiés dans l'image (décidé le 2026-09-24, même principe que [catalogue-depuis-github.md](catalogue-depuis-github.md)): location `type: url` avec `allow: [Template]`. `templates/**` est déjà dans le `paths-ignore` du workflow
- [ ] Tester le comportement des chemins relatifs `../../skeletons/...` avec un enregistrement par URL
- [ ] Reprendre les templates un par un: `create-vpc`, `create-internet-gateway`, `create-route-table`, `create-subnet-pub`, `create-subnet-priv`, `create-security-group`, `create-eks-cluster`, `stack-network`
- [ ] Reprendre `RegionPicker` (dépend des templates)
- [ ] Décider: garder ou non `basic-repo` (template de test du token)
- [ ] Vérifier la position du champ `description` de `publish:gitlab` si GitLab est utilisé
- [ ] Tester la condition de concurrence connue de `catalog:register` (backstage#8597)

## 4. Plateforme Crossplane, ArgoCD (projet d'origine)

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

## 5. Hôte Saltbox et rôles

- [ ] Décider: déployer `tracearr` sur l'hôte (`sb update`, copie du rôle, enregistrement, déploiement, tag `tracearr-claim`)
- [ ] Vérifier `sb install mod-<tag>` dans le binaire `sb` (pour l'instant tiré du README de `saltbox_mod`)
- [ ] Autres plateformes (Docker Desktop, Kubernetes), le moment venu: définir comment fournir les variables secrètes (`AUTH_GITHUB_CLIENT_ID`, `AUTH_GITHUB_CLIENT_SECRET`, `POSTGRES_*`), surcharger `app.baseUrl` et `backend.baseUrl` (fixées à `backstage.mathod.fr` dans `app-config.production.yaml`), ajouter la Redirect URI correspondante dans l'application OAuth GitHub, pas d'Authelia côté Kubernetes. L'Inventory Saltbox est spécifique à l'hôte actuel

## 6. Skills et outillage (dépôt `Mathod95/skills`)

- [ ] Réécrire proprement le skill `create-docs` (zensical)
- [ ] Décider: créer le skill `crossplane/manage-lifecycle` (candidat noté)
- [ ] Compléter `saltbox/create-custom-role` avec les retours des prochains vrais déploiements
- [ ] Optimiser la `description` de `learn-a-tech` avec `skill-creator` après quelques usages réels
- [ ] Fixer une règle numérique de péremption pour les fichiers de référence
