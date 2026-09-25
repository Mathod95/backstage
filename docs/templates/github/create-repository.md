---
title: Create repository
description: Template qui crée un repo GitHub vide dans l'organisation d'un client
icon: material/github
status: draft
createdAt: 2026-09-25
modifyAt: 2026-09-25
todo:
  - "[ ] Tester le template sur une organisation de test"
---

# Create repository

> Crée un repo GitHub vide dans l'organisation d'un client.

Template `github-create-repo`, défini dans `templates/github/create-repo/template.yaml`. Premier template, pour tester la chaîne formulaire, action GitHub et catalogue. Le repo créé est vraiment vide: aucun fichier, aucun commit.

## Form

| Field        | Required | Value                                                           |
| ------------ | -------- | --------------------------------------------------------------- |
| Repository   | Oui      | Organisation du client (owner) et nom du repo, sur `github.com` |
| Description  | Non      | Description du repo sur GitHub                                  |
| Visibility   | Non      | `private` (par défaut) ou `public`                              |
| GitHub token | Oui      | Jeton autorisé à créer un repo dans l'organisation du client    |

## Token

Le jeton est saisi à chaque utilisation, dans un champ `Secret`: il n'est jamais enregistré, ni dans Backstage ni dans les logs. Aucun accès aux repos des clients n'est stocké.

Pour limiter le jeton à un seul client, créer un jeton fine-grained sur <https://github.com/settings/personal-access-tokens/new>:

| Field             | Value                                            |
| ----------------- | ------------------------------------------------ |
| Resource owner    | L'organisation du client                         |
| Repository access | All repositories (nécessaire pour créer un repo) |
| Permissions       | `Administration: Read and write`                 |

D'après la doc GitHub, la création d'un repo d'organisation (`POST /orgs/{org}/repos`) accepte l'une de ces permissions en écriture: `Administration` ou `Repository creation`. L'organisation doit aussi autoriser les jetons fine-grained, et peut exiger de valider chaque jeton. Pas encore testé en conditions réelles.

## Steps

Une seule action, `github:repo:create`: elle crée le repo sans rien y pousser.

```yaml title="templates/github/create-repo/template.yaml"
  steps:
    - id: create
      name: Create repository
      # Creates the repository only: nothing is pushed, it stays empty (autoInit is false)
      action: github:repo:create
      input:
        repoUrl: ${{ parameters.repoUrl }}
        description: ${{ parameters.description }}
        repoVisibility: ${{ parameters.repoVisibility }}
        token: ${{ secrets.token }}
```

À la fin, un lien mène au nouveau repo sur GitHub.

## Sources

- Écrire un template: <https://backstage.io/docs/features/software-templates/writing-templates>
- Action `github:repo:create`: code de `@backstage/plugin-scaffolder-backend-module-github` (`githubRepoCreate`), et liste des actions sur `/create/actions` de l'instance
- Champ `Secret`: code de `@backstage/plugin-scaffolder` (`SecretInput`)
- Permissions des jetons fine-grained: <https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens>
