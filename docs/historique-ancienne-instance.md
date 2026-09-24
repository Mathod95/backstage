# Historique de l'ancienne instance Backstage et points à reprendre

Ce document garde la trace de l'ancienne instance Backstage locale (dossier `~/backstage`, jamais poussé sur ce repo) pour pouvoir reprendre le travail sans dépendre de l'historique d'une conversation. Le repo actuel est volontairement un Backstage stock (sortie inchangée de `@backstage/create-app`), déployé via le rôle Saltbox du repo `Mathod95/saltbox`.

La liste des tâches est dans [todo.md](todo.md).

Rédigé le 2026-09-24. Tout ce qui est décrit comme "existant" a été relu sur disque à cette date, ce qui n'a pas été vérifié est signalé comme tel.

## À retenir en premier

Trois constats à connaître avant de reprendre quoi que ce soit de l'ancienne instance.

1. **Les templates n'ont jamais été validés contre AWS.** Le provider AWS n'a jamais été installé sur le cluster de test `backstage-crossplane` (il n'y a que `provider-helm` et `provider-kubernetes`). Un commentaire dans `skeletons/vpc/vpc.yaml` le dit: les champs n'ont pas été testés contre les vraies CRD. Installer le provider AWS (registre Upbound) est un prérequis avant de faire confiance aux 9 templates.
2. **Les skeletons utilisent les API Crossplane cluster-scoped.** Les gabarits contiennent `ec2.aws.upbound.io` (8 fichiers), `eks.aws.upbound.io` et `iam.aws.upbound.io`, pas les groupes namespaced `.m.` de Crossplane v2 (par exemple `ec2.aws.m.upbound.io`). Les deux familles existent dans le même package Upbound, pour deux portées différentes (cluster ou namespace). Il faut trancher laquelle on veut avant de reprendre les skeletons, en cohérence avec la décision "XR namespaced, pas de Claims".
3. **L'image actuelle ne contient pas les templates.** Le `Dockerfile` généré ne copie que `examples/` et les `app-config*.yaml`, donc ni `templates/` ni `skeletons/` ne seraient présents dans le conteneur. Deux options: les copier dans l'image (modifier le `Dockerfile`), ou enregistrer les templates dans le catalogue par URL GitHub (`type: url`). Avec l'option URL, les chemins relatifs comme `../../skeletons/vpc` d'un `fetch:template` seraient résolus par rapport à l'URL du template, et l'intégration GitHub devrait pouvoir lire le repo: ce comportement n'a pas été testé, à vérifier avant de choisir.

## But du projet d'origine

Un cockpit Backstage pour un consultant DevOps (Kubernetes, ArgoCD, Crossplane, AWS): générer et déclencher des déploiements de plateforme client reproductibles (EKS, GitOps via ArgoCD, Crossplane, Prometheus), sans conserver localement ni identifiants ni état client. Chaque repo GitOps de client est la source de vérité de son infrastructure.

## Modifications faites sur l'ancienne instance (par rapport à un Backstage stock)

### Application

- Titre `Mathod.io` (`app.title`), logos de la barre latérale (`LogoFull.tsx`, `LogoIcon.tsx`) et page d'accueil personnalisée avec le logo (`homeModule.tsx`, image `packages/app/src/assets/mathod-logo.png`).
- Connexion **GitHub uniquement**, le fournisseur invité a été retiré volontairement. Côté frontend une page de connexion `SignInPageBlueprint` avec `githubAuthApiRef`, côté backend `plugin-auth-backend-module-github-provider` à la place du module invité, résolveur `userIdMatchingUserEntityAnnotation`.
- Utilisateurs déclarés dans `examples/org.yaml` avec l'annotation `github.com/user-id`.
- Champ de formulaire personnalisé `RegionPicker` (liste de régions AWS avec recherche, `ui:field: RegionPicker`), source unique de la liste dans `awsRegions.ts`, utilisé par tous les templates.
- Postgres à la place de SQLite, variables `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` avec des valeurs par défaut locales (port 5433, conteneur Docker `backstage-postgres`).
- Intégration GitHub (`integrations.github`) et secret OAuth dans des fichiers non versionnés. Ne jamais recopier ces valeurs dans ce repo.
- Catalogue: un `location` par template, règle `allow: [Template]`, `csp`, `cors` et `actions.pluginSources` (auth, catalog, scaffolder) ajustés pour le développement local.
- TechDocs en mode `local` avec un `mkdocs.yml` ("Cockpit Backstage") qui publiait `docs/decisions.md` et `docs/roadmap.md`.

### Templates Software Templates (9)

| Template | Rôle | Étapes |
|---|---|---|
| `basic-repo` | Test de sécurité du token Git (champ Secret jamais persisté), GitHub ou GitLab | `fetch:template`, `publish:github` ou `publish:gitlab` |
| `create-vpc` | Ajoute un VPC Crossplane au repo GitOps d'un client | `fetch:template`, `publish:github:pull-request` |
| `create-internet-gateway` | Internet Gateway rattaché au VPC du client | idem |
| `create-route-table` | Route table publique ou privée | idem |
| `create-subnet-pub` | Subnet public (CIDR, zone de disponibilité) | idem |
| `create-subnet-priv` | Subnet privé (CIDR, zone de disponibilité) | idem |
| `create-security-group` | Security group pour le cluster EKS | idem |
| `create-eks-cluster` | Rôle IAM et cluster EKS (version Kubernetes), tags `eks`, `crossplane`, `aws` | idem |
| `stack-network` | Tout le réseau en un run (VPC, IGW, 2 route tables, 1 subnet public, 1 privé, security group) en réutilisant les mêmes skeletons | 7 `fetch:template` puis 1 PR |

Pattern commun des templates:
- Paramètres `clientSlug` (identifiant court du client, utilisé comme label sur toutes les ressources), `region` (via `RegionPicker`), `repoUrl` (via `RepoUrlPicker`, `github.com` uniquement) et `token` (champ `ui:field: Secret`).
- Les manifestes viennent de `skeletons/<ressource>/*.yaml` (gabarits Nunjucks avec `{{ values.clientSlug }}`), rendus par `fetch:template` dans `infra/network` du repo cible.
- La sortie est une Pull Request (`publish:github:pull-request`), jamais un push direct.
- Ressources Crossplane de type Managed Resource brutes, rattachées entre elles par le label `client`.

### Infrastructure locale de développement

- Cluster KinD `backstage-crossplane` avec Crossplane, uniquement comme bac à sable pour écrire et valider les Compositions. Dossier `infra/crossplane/` avec `provider-helm` et `provider-kubernetes` (registre Upbound).
- Le provider AWS n'a **jamais été installé** sur ce cluster: les skeletons AWS n'ont donc jamais été validés contre de vraies CRD (un commentaire dans `skeletons/vpc/vpc.yaml` le dit).

## Décisions d'architecture prises

Détail complet dans l'ancien `docs/decisions.md`. Résumé:
- Pas de Taskfile, pas d'OpenTofu: Crossplane fait tout, y compris créer l'EKS puis installer ArgoCD dessus.
- Deux instances Crossplane distinctes: un control-plane de bootstrap éphémère (dans le runner CI, détruit après usage) et un Crossplane permanent installé par ArgoCD chez le client.
- Les ressources créées par le bootstrap doivent être adoptées par le Crossplane permanent (annotation `crossplane.io/external-name` et `managementPolicies: ["Observe"]` puis `["*"]`).
- Crossplane v2: plus de Claims, XR namespaced. Providers en builds Upbound (`xpkg.upbound.io/upbound/...`).
- Jamais de token Git en clair dans la config: saisi à l'exécution du template via un champ `Secret`.
- Authentification: pas de mot de passe natif dans Backstage, uniquement OAuth/OIDC/SAML (et l'invité). Piste notée: un petit fournisseur d'identité local (Dex).

## Pièges rencontrés

- L'annotation `github.com/user-id` attend le `node_id` GraphQL du compte GitHub, pas l'identifiant numérique de l'API REST.
- Le fournisseur invité est désactivé côté serveur quand `NODE_ENV=production`, sauf `auth.providers.guest.dangerouslyAllowOutsideDevelopment`.
- Le titre "Scaffolded Backstage App" est la valeur par défaut de `app.title` dans le modèle officiel.
- `create-app` a besoin d'un nom d'application (invite interactive) et accepte `--path` pour cibler un dossier existant.
- Une dépendance transitive peut être temporairement mise en quarantaine par Yarn (`YN0016`), relancer l'installation plus tard suffit.
- `publish:gitlab`: la position exacte du champ `description` n'a jamais été tranchée (à vérifier sur `/create/actions` d'une instance réelle).
- Un secret OAuth a été collé une fois dans un fichier lisible par l'assistant: il a été considéré comme compromis, à faire tourner.

## État du nouveau dépôt

- App stock, image publiée par GitHub Actions sur `ghcr.io/mathod95/backstage`, déployée par le rôle Saltbox (`Mathod95/saltbox`, rôle `backstage`) avec Postgres géré par le rôle `postgres` natif, derrière Authelia.
- Règle de travail: le rôle installe et met à jour, la configuration de l'application vit dans ce repo, pour rester déployable ailleurs (Kubernetes).
- Connexion actuelle: invité, activé par une variable dans l'Inventory de l'hôte, en attendant GitHub OAuth.
- Aucun template, aucun composant personnalisé n'a encore été repris de l'ancienne instance.

## Points à trancher pour la reprise

| Point | Où on en est | Reprendre dans ce repo ? |
|---|---|---|
| Authentification GitHub OAuth | Fonctionnait sur l'ancienne instance (code et config décrits plus haut), pas encore sur celle-ci | Recommandé en premier, sécurité. Les identifiants passent par des variables d'environnement, jamais dans le repo |
| Politique de permissions | Le module `allow-all-policy` du modèle stock est prévu pour le développement | À décider avec l'authentification (qui peut lancer quel template) |
| Provider AWS sur le cluster de test | Jamais installé, seuls `provider-helm` et `provider-kubernetes` le sont | Prérequis pour valider les templates. À faire avant de reprendre quoi que ce soit d'AWS |
| Templates et skeletons (9) | Écrits, jamais validés contre AWS | À décider. Ils ne sont pas dans l'image actuelle: le `Dockerfile` ne copie que `examples` |
| Enregistrement des templates dans le catalogue | Sur l'ancienne instance, `type: file` avec des chemins relatifs au dépôt local | Deux options: copier `templates/` et `skeletons/` dans l'image, ou `type: url` vers GitHub. Le comportement des chemins relatifs `../../skeletons/...` avec une URL n'a pas été testé |
| Skeletons et API Crossplane | Groupes cluster-scoped (`ec2.aws.upbound.io`), pas les groupes namespaced `.m.` de Crossplane v2 | À trancher avant de reprendre, cohérent avec la décision "XR namespaced, pas de Claims" |
| Champ `RegionPicker` | Fonctionnel sur l'ancienne instance | Dépend des templates. Sinon inutile |
| Branding (titre, logos, page d'accueil) | Fait sur l'ancienne instance | Optionnel, à faire dans `app-config.yaml` et le code de l'app, pas dans le rôle |
| Utilisateurs du catalogue (`org.yaml`) | Un utilisateur avec l'annotation GitHub | Nécessaire avec GitHub OAuth |
| Catalogue de production | Le stock charge les données d'exemple | À remplacer par les vraies sources |
| TechDocs | Mode `local`, déconseillé en production par la doc | À décider: génération en CI et stockage externe |
| Clé d'authentification backend (`backend.auth.keys`) | Non configurée | À prévoir avant un usage multi-instance |
| Modules d'événements, plugin Kubernetes | Avertissements dans les logs du stock, sans conséquence | Seulement si le besoin apparaît |
| Token d'intégration GitHub du scaffolder | Token de test avec droits larges sur l'ancienne instance | Le réduire au minimum (fine-grained) avant tout usage réel |
| Backend Postgres, sauvegardes | Persistance assurée par le rôle `postgres` de Saltbox, pas de sauvegarde planifiée décrite | À décider |

Points de l'ancienne roadmap toujours ouverts, indépendants de l'instance actuelle:
- Écrire une première Composition Crossplane (XR namespaced) et valider `provider-helm`, puis ajouter le provider AWS au cluster de test.
- Concevoir la propagation des `external-name` entre bootstrap éphémère et Crossplane permanent.
- Construire le vrai template `new-client` (nom client, région, topologie VPC, fournisseur Git, add-ons) et des templates satellites (`new-iam-role`).
- Décider de l'enregistrement catalogue par client et de la fourniture du rôle IAM OIDC au client.
- Mettre à jour le brief initial, qui contredit désormais les décisions prises.
- Plugin Crossplane pour Backstage (TeraSky), hors périmètre du MVP.

## Déploiement actuel sur Saltbox (rappel)

Process sur l'hôte, détaillé dans le README du repo `Mathod95/saltbox`:
1. Mettre Saltbox à jour (`sb update`). Le rôle utilise le plugin `role_web`, ajouté à Saltbox le 2026-08-24, et échoue avec `The lookup plugin 'role_web' was not found` sur une installation plus ancienne.
2. Installer `saltbox_mod` (`sb install saltbox-mod`), copier le rôle dans `/opt/saltbox_mod/roles/backstage` et l'enregistrer dans `/opt/saltbox_mod/saltbox_mod.yml`.
3. Déployer avec `sb install mod-backstage`. Le rôle déploie lui-même l'instance Postgres (`backstage-postgres`), génère et persiste son mot de passe, puis crée le conteneur derrière Traefik et Authelia. Relancer la commande recrée le conteneur avec la dernière image sans toucher aux données.
4. Pour mettre à jour l'application: pousser sur `main` (la pipeline construit et publie l'image, tags `latest` et sha du commit), attendre qu'elle soit verte, puis relancer `sb install mod-backstage`.

Points appris pendant ce déploiement:
- Le paquet GHCR doit être public pour que l'hôte puisse tirer l'image sans `docker login`.
- Les URLs publiques (`app.baseUrl`, `backend.baseUrl`) sont dans `app-config.production.yaml` de ce repo. Le rôle ne les injecte pas, pour que la même image reste déployable ailleurs.
- La connexion invité passe par une ligne dans l'Inventory de l'hôte, `backstage_role_docker_envs_custom` avec `APP_CONFIG_auth_providers_guest_dangerouslyAllowOutsideDevelopment: "true"`. À supprimer dès que GitHub OAuth est en place.
- Après la première connexion invité, le navigateur peut proposer de "passer au nouveau module invité": répondre OK.
- Les linters (`saltbox-lint`, `ansible-lint`) ne détectent pas l'absence d'un plugin sur l'hôte: seul un vrai run le montre.

## Notes de recherche Backstage utiles à la reprise

Vérifiées en direct le 2026-09-23 (voir `references/backstage.md` dans le dépôt de skills):
- Version stable au moment de la recherche: 1.55.1. Le nouveau système frontend est le défaut de `create-app` (option `--legacy` pour l'ancien).
- Yarn: la page de démarrage annonce 4.4.1 mais le modèle épingle 4.13.0, se fier au modèle.
- Points de santé: `/.backstage/health/v1/readiness` et `/.backstage/health/v1/liveness` avec le nouveau backend system, `/healthcheck` avec l'ancien.
- TechDocs: la doc recommande de sortir de `builder: local` en production et de générer les docs en CI.
- Le chart Helm officiel de Backstage reste explicitement une démonstration, pas une base de production.
- `catalog:register` a un défaut connu de condition de concurrence (issue backstage#8597), à garder en tête pour un enregistrement automatique par client.
- Le moteur de gabarits est officiellement appelé "Nunjitsu" (sous-ensemble de Nunjucks): tester en dry-run les opérateurs avancés plutôt que les supposer.

## Autres points hors de l'application

- Le skill `create-docs` (site de documentation zensical) doit être réécrit proprement, ce qui a été volontairement différé.
- Un candidat de skill est noté et non créé: `crossplane/manage-lifecycle` (`managementPolicies`, import de ressources existantes, orphelinage à la destruction d'un cluster), utile pour le mécanisme d'adoption entre bootstrap éphémère et Crossplane permanent.
- Un skill `saltbox/create-custom-role` existe maintenant, avec un script de lint réutilisable, pour tout futur rôle Saltbox.

## Où retrouver les sources

- Ancienne instance: dossier local `~/backstage` (templates, skeletons, `docs/decisions.md`, `docs/roadmap.md`, `NOTES-backstage.md`, `NOTES-crossplane.md`). L'ancien dépôt GitHub a été abandonné.
- Références techniques vérifiées en direct: dépôt de skills `Mathod95/skills`, fichiers `references/backstage.md`, `references/crossplane.md`, `references/saltbox.md`.
