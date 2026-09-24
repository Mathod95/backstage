---
title: Configuration
description: Aperçu local de la doc avec Zensical et fonctionnalités ajoutées
icon: material/cog
status: draft
date: 2026-09-24
todo: []
---

# Configuration

> Configuration de Zensical dans ce repo: l'aperçu local de la doc, et les fonctionnalités ajoutées au thème.

## Aperçu local

Pour voir une page sans pousser ni attendre Backstage, la doc se prévisualise en local avec Zensical:

```bash
zensical/.venv/bin/zensical serve -f zensical.toml
```

Puis ouvrir <http://localhost:8000>. La page se met à jour à chaque enregistrement.

Première installation, une seule fois:

```bash
python3 -m venv zensical/.venv && zensical/.venv/bin/pip install zensical
```

### Organisation des fichiers

| File                                     | Read by              | Role                                             |
| ---------------------------------------- | -------------------- | ------------------------------------------------ |
| `docs/`                                  | MkDocs et Zensical   | Les pages, un seul exemplaire                    |
| `mkdocs.yml`                             | TechDocs (Backstage) | Doc publiée dans Backstage                       |
| `zensical.toml`                          | Zensical             | Aperçu local                                     |
| `docs/javascripts/`, `docs/stylesheets/` | Zensical             | Fonctionnalités ajoutées (voir plus bas)         |
| `overrides/`                             | Zensical             | Surcharges de templates du thème (voir plus bas) |

Le menu est écrit deux fois, dans `mkdocs.yml` et dans `zensical.toml`: toute page ajoutée doit l'être dans les deux.

!!! warning "Aperçu différent de Backstage"
    L'aperçu montre la doc telle que Zensical la rend. Tant que Backstage utilise TechDocs (MkDocs), le rendu dans Backstage reste différent: voir [TechDocs](../techdocs.md). Les fonctionnalités ajoutées ci-dessous ne sont déclarées que dans `zensical.toml`: elles n'existent que dans l'aperçu.

La config Zensical doit être à la racine du repo: Zensical refuse un dossier de pages situé en dehors de son propre dossier (`docs_dir must be within project root`), même à travers un lien symbolique (testé le 2026-09-24 avec Zensical 0.0.64).

## Fonctionnalités ajoutées

Cinq fonctionnalités développées dans [Mathod95/zensical](https://github.com/Mathod95/zensical), installées le 2026-09-24 à partir des dossiers `example/` du repo. Chaque titre mène au README de la fonctionnalité, qui détaille son usage.

Les scripts et styles sont déclarés dans `zensical.toml`, dans le même ordre que dans le repo d'origine:

```toml
extra_css = ["stylesheets/toggle-sidebar.css", "stylesheets/codeBlock.css", "stylesheets/open-in-new-tab.css", "stylesheets/placeholders.css"]
extra_javascript = ["javascripts/toggle-sidebar.js", "javascripts/codeBlock.js", "javascripts/open-in-new-tab.js", "javascripts/placeholders.js"]
```

### [Toggle sidebar](https://github.com/Mathod95/zensical/tree/main/toggle-sidebar)

Un bouton dans l'en-tête et des raccourcis clavier pour masquer ou afficher le menu et la table des matières: `b` les deux, `m` le menu seul, `t` la table des matières seule. Le choix est mémorisé dans le navigateur.

Fichiers: `docs/javascripts/toggle-sidebar.js`, `docs/stylesheets/toggle-sidebar.css`.

### [On this page](https://github.com/Mathod95/zensical/tree/main/on-this-page)

Le titre "On this page" en tête de la table des matières devient cliquable et remonte en haut de la page.

Fichier: `overrides/partials/toc.html`, activé par `custom_dir = "overrides"` dans `zensical.toml`.

### [codeBlock](https://github.com/Mathod95/zensical/tree/main/codeBlock)

Des blocs de code enrichis, activés par la classe `.codeblock` sur un bloc: transcript commande/sortie repliable avec boutons copier, icône selon le type de fichier, aperçu tronqué ("peek"), lignes floutées révélées au survol, lignes zébrées, et quatre palettes de couleurs.

Fichiers: `docs/javascripts/codeBlock.js`, `docs/stylesheets/codeBlock.css`. Les extensions Markdown qu'il demande sont déjà actives dans la config générée par `zensical new`.

### [open-in-new-tab](https://github.com/Mathod95/zensical/tree/main/open-in-new-tab)

Les liens externes et les fichiers téléchargeables (PDF, zip...) s'ouvrent dans un nouvel onglet, avec une petite icône après les liens externes.

Fichiers: `docs/javascripts/open-in-new-tab.js`, `docs/stylesheets/open-in-new-tab.css`.

### [placeholders](https://github.com/Mathod95/zensical/tree/main/placeholders)

Un `{{ variable }}` dans le texte, ou `<variable>` dans un bloc de code, devient une zone que chaque lecteur peut remplir avec sa propre valeur. Toutes les occurrences du même nom se mettent à jour, et la valeur reste mémorisée dans le navigateur.

Fichiers: `docs/javascripts/placeholders.js`, `docs/stylesheets/placeholders.css`.

## Sources

- Zensical: <https://zensical.org/docs/>
- Fonctionnalités ajoutées: [Mathod95/zensical](https://github.com/Mathod95/zensical)
