---
title: Deployment
description: Construction de l'image et déploiement sur l'hôte Saltbox
icon: material/rocket-launch
status: review
createdAt: 2026-09-24
modifyAt: 2026-09-25
todo: []
---

# Deployment

> Comment l'image est construite, puis déployée sur l'hôte Saltbox.

Le déploiement sur Saltbox est spécifique à cette plateforme. L'image, elle, reste déployable ailleurs (Docker Desktop, Kubernetes): voir [Settings](settings.md#secrets) pour les variables qu'elle attend.

## Image

À chaque push sur `main`, la pipeline GitHub Actions construit l'image et la publie sur `ghcr.io/mathod95/backstage`, avec deux tags: `latest` et le sha du commit. Un push qui ne touche que la doc ou les données du catalogue ne la relance pas (voir [Catalog](catalog.md#configuration)).

Le paquet GHCR est public: l'hôte peut tirer l'image sans `docker login`.

## Saltbox

Le rôle `backstage` du repo [Mathod95/saltbox](https://github.com/Mathod95/saltbox) installe et met à jour l'application. La configuration de l'application vit dans ce repo, pas dans le rôle, pour que la même image reste déployable ailleurs.

Première installation sur l'hôte, détaillée dans le README du repo `Mathod95/saltbox`:

1. Mettre Saltbox à jour avec `sb update`. Le rôle utilise le plugin `role_web`, ajouté à Saltbox le 2026-08-24: sur une installation plus ancienne, il échoue avec `The lookup plugin 'role_web' was not found`.
2. Installer `saltbox_mod` avec `sb install saltbox-mod`, copier le rôle dans `/opt/saltbox_mod/roles/backstage` et l'enregistrer dans `/opt/saltbox_mod/saltbox_mod.yml`.
3. Déployer avec `sb install mod-backstage`. Le rôle déploie lui-même Postgres (conteneur `backstage-postgres`), génère et garde son mot de passe, puis crée le conteneur Backstage derrière Traefik et Authelia.

## Update

1. Pousser sur `main`.
2. Attendre que la pipeline soit verte.
3. Relancer `sb install mod-backstage`: le conteneur est recréé avec la dernière image, sans toucher aux données.

## Notes

- Les adresses publiques (`app.baseUrl`, `backend.baseUrl`) sont dans `app-config.production.yaml` de ce repo. Le rôle ne les injecte pas.
- L'Inventory de l'hôte ne fournit que des secrets (voir [Settings](settings.md#secrets)), jamais de surcharge de configuration.
- Les linters (`saltbox-lint`, `ansible-lint`) ne détectent pas l'absence d'un plugin sur l'hôte: seul un vrai déploiement le montre.

## Sources

- README du repo [Mathod95/saltbox](https://github.com/Mathod95/saltbox)
