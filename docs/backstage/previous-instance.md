---
title: Previous instance
description: L'ancienne instance Backstage locale, ce qu'elle contenait et ce qui est à reprendre
icon: material/history
status: review
createdAt: 2026-09-24
modifyAt: 2026-09-25
todo: []
---

# Previous instance

> L'ancienne instance Backstage locale: ce qu'elle contenait, les décisions prises et ce qui reste à reprendre.

L'ancienne instance vit dans le dossier local `~/backstage`, jamais poussé sur ce repo. L'ancien dépôt GitHub a été abandonné. Cette page garde sa trace pour reprendre le travail sans dépendre de l'historique d'une conversation. Relue sur disque le 2026-09-24. Les points à reprendre sont suivis dans la [todo](../index.md#todo).

## Key facts

Trois constats à connaître avant de reprendre quoi que ce soit:

1. **Les templates n'ont jamais été validés contre AWS.** Le provider AWS n'a jamais été installé sur le cluster de test `backstage-crossplane` (seulement `provider-helm` et `provider-kubernetes`). Un commentaire dans `skeletons/vpc/vpc.yaml` le dit: les champs n'ont pas été testés contre les vraies CRD.
2. **Les skeletons utilisent les API Crossplane cluster-scoped.** Les gabarits contiennent `ec2.aws.upbound.io`, `eks.aws.upbound.io` et `iam.aws.upbound.io`, pas les groupes namespaced `.m.` de Crossplane v2 (par exemple `ec2.aws.m.upbound.io`). Il faut trancher avant de les reprendre, en cohérence avec la décision "XR namespaced, pas de Claims".
3. **Les templates seront lus sur GitHub**, pas copiés dans l'image (voir [Catalog](catalog.md)). Les chemins relatifs comme `../../skeletons/vpc` d'un `fetch:template` seront résolus par rapport à l'URL du template: comportement à tester.

## Goal

Un cockpit Backstage pour un consultant DevOps (Kubernetes, ArgoCD, Crossplane, AWS): générer et déclencher des déploiements de plateforme client reproductibles (EKS, GitOps via ArgoCD, Crossplane, Prometheus), sans conserver localement ni identifiants ni état client. Chaque repo GitOps de client est la source de vérité de son infrastructure.

## Changes

### App

- Titre `Mathod.io`, logos de la barre latérale et page d'accueil personnalisée avec le logo.
- Connexion **GitHub uniquement**, avec le résolveur `userIdMatchingUserEntityAnnotation`.
- Utilisateurs déclarés dans `examples/org.yaml` avec l'annotation `github.com/user-id`.
- Champ de formulaire personnalisé `RegionPicker` (liste de régions AWS avec recherche, `ui:field: RegionPicker`), avec la liste dans `awsRegions.ts`, utilisé par tous les templates.
- Postgres à la place de SQLite, en local (port 5433, conteneur Docker `backstage-postgres`).
- Intégration GitHub et secret OAuth dans des fichiers non versionnés. Ne jamais recopier ces valeurs dans ce repo.
- Catalogue: une location par template, règle `allow: [Template]`.
- TechDocs en mode `local` avec un `mkdocs.yml` ("Cockpit Backstage") qui publiait `docs/decisions.md` et `docs/roadmap.md`.

### Templates

| Template                  | Role                                               | Steps                                           |
| ------------------------- | -------------------------------------------------- | ----------------------------------------------- |
| `basic-repo`              | Test du token Git (champ Secret), GitHub ou GitLab | `fetch:template`, `publish:github` ou `gitlab`  |
| `create-vpc`              | VPC Crossplane dans le repo GitOps du client       | `fetch:template`, `publish:github:pull-request` |
| `create-internet-gateway` | Internet Gateway rattaché au VPC du client         | Idem                                            |
| `create-route-table`      | Route table publique ou privée                     | Idem                                            |
| `create-subnet-pub`       | Subnet public (CIDR, zone de disponibilité)        | Idem                                            |
| `create-subnet-priv`      | Subnet privé (CIDR, zone de disponibilité)         | Idem                                            |
| `create-security-group`   | Security group pour le cluster EKS                 | Idem                                            |
| `create-eks-cluster`      | Rôle IAM et cluster EKS                            | Idem                                            |
| `stack-network`           | Tout le réseau en un run, avec les mêmes skeletons | 7 `fetch:template` puis 1 PR                    |

`stack-network` crée le VPC, l'Internet Gateway, 2 route tables, un subnet public, un privé et le security group.

Principe commun des templates:

- Paramètres `clientSlug` (identifiant court du client, utilisé comme label sur toutes les ressources), `region` (via `RegionPicker`), `repoUrl` (via `RepoUrlPicker`, `github.com` uniquement) et `token` (champ `ui:field: Secret`).
- Les manifestes viennent de `skeletons/<ressource>/*.yaml` (gabarits avec `{{ values.clientSlug }}`), rendus par `fetch:template` dans `infra/network` du repo cible.
- La sortie est une Pull Request (`publish:github:pull-request`), jamais un push direct.
- Ressources Crossplane de type Managed Resource, rattachées entre elles par le label `client`.

### Local infrastructure

- Cluster KinD `backstage-crossplane` avec Crossplane, comme bac à sable pour écrire et valider les Compositions. Dossier `infra/crossplane/` avec `provider-helm` et `provider-kubernetes` (registre Upbound).
- Le provider AWS n'a **jamais été installé** sur ce cluster.

## Decisions

Détail complet dans l'ancien `docs/decisions.md`. Résumé:

- Pas de Taskfile, pas d'OpenTofu: Crossplane fait tout, y compris créer l'EKS puis installer ArgoCD dessus.
- Deux instances Crossplane distinctes: un control-plane de bootstrap éphémère (dans le runner CI, détruit après usage) et un Crossplane permanent installé par ArgoCD chez le client.
- Les ressources créées par le bootstrap sont adoptées par le Crossplane permanent (annotation `crossplane.io/external-name`, et `managementPolicies: ["Observe"]` puis `["*"]`).
- Crossplane v2: plus de Claims, XR namespaced. Providers en builds Upbound (`xpkg.upbound.io/upbound/...`).
- Jamais de token Git en clair dans la config: il est saisi à l'exécution du template via un champ `Secret`.
- Authentification: pas de mot de passe natif dans Backstage, uniquement OAuth, OIDC ou SAML. Piste notée: un petit fournisseur d'identité local (Dex).

## Pitfalls

- L'annotation `github.com/user-id` attend le `node_id` GraphQL du compte GitHub, pas l'identifiant numérique de l'API REST.
- Le fournisseur invité est désactivé côté serveur quand `NODE_ENV=production`, sauf `auth.providers.guest.dangerouslyAllowOutsideDevelopment`.
- `create-app` demande un nom d'application et accepte `--path` pour cibler un dossier existant.
- Une dépendance peut être temporairement mise en quarantaine par Yarn (`YN0016`): relancer l'installation plus tard suffit.
- `publish:gitlab`: la position exacte du champ `description` n'a jamais été tranchée.
- Un secret OAuth a été collé une fois dans un fichier lisible par l'assistant: il a été considéré comme compromis, et remplacé.

## Research notes

Vérifiées le 2026-09-23 (voir `references/backstage.md` dans le dépôt `Mathod95/skills`):

- Le nouveau système frontend est le défaut de `create-app` (option `--legacy` pour l'ancien).
- Yarn: la page de démarrage annonce 4.4.1 mais le modèle épingle 4.13.0, se fier au modèle.
- Points de santé: `/.backstage/health/v1/readiness` et `/.backstage/health/v1/liveness` avec le nouveau système backend.
- Le chart Helm officiel de Backstage reste une démonstration, pas une base de production.
- `catalog:register` a un défaut connu de condition de concurrence (issue backstage#8597), à garder en tête pour un enregistrement automatique par client.
- Le moteur de gabarits des templates est un sous-ensemble de Nunjucks: tester en dry-run les opérateurs avancés plutôt que les supposer.

## Sources

- Ancienne instance: dossier local `~/backstage` (templates, skeletons, `docs/decisions.md`, `docs/roadmap.md`, `NOTES-backstage.md`, `NOTES-crossplane.md`)
- Références techniques: dépôt `Mathod95/skills`, fichiers `references/backstage.md`, `references/crossplane.md`, `references/saltbox.md`
