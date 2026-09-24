---
title: Settings
description: Où se règle chaque élément personnalisable de l'interface
icon: material/tune
status: draft
date: 2026-09-24
todo:
  - "[x] Restructurer convenablement les tableaux"
  - "[x] Les titres des tableau en anglais"
---

# Settings

> Carte de tout ce qu'on peut personnaliser dans l'interface, avec le fichier où ça se règle et la valeur actuelle.

État actuel: **rien n'est personnalisé**, tout est resté comme dans le modèle `create-app` (Backstage 1.55.0, nouveau système frontend).

Tous ces réglages sont dans le code ou dans `app-config.yaml`, donc dans l'image: chaque changement demande un rebuild et un redéploiement (voir [Catalogue lu depuis GitHub](../../catalogue-depuis-github.md)). Le mieux est donc de regrouper les personnalisations dans un seul lot.

## Branding and theming

La personnalisation se divise en deux parties, qui ne se règlent pas au même endroit:

| Family                | What                                    | Where                                    |
| --------------------- | --------------------------------------- | ---------------------------------------- |
| **Branding**          | L'identité: noms, textes, logos, icônes | Surtout `app-config.yaml`, voir la carte |
| **Theming graphique** | L'apparence: couleurs, polices, formes  | Le thème, dans `packages/app/src/theme/` |

Le branding se change en quelques lignes, sans rien savoir du thème. Le theming graphique demande d'écrire le thème une fois (`theme.ts` pour MUI, `theme.css` pour BUI), puis s'applique à toutes les pages: voir [Theme](theme.md).

## Settings map

Les chemins de fichiers sont relatifs à `packages/app/`.

| Element                          | File                              | Setting                              | Current value                   |
| -------------------------------- | --------------------------------- | ------------------------------------ | ------------------------------- |
| Nom de l'application             | `app-config.yaml` (racine)        | `app.title`                          | `Scaffolded Backstage App`      |
| Nom de l'organisation            | `app-config.yaml` (racine)        | `organization.name`                  | `My Company`                    |
| Nom pour les assistants IA (MCP) | `app-config.yaml` (racine)        | `mcpActions.name`, `.description`    | `My Company Backstage`          |
| Lien "Support"                   | `app-config.yaml` (racine)        | `app.support`                        | Non défini                      |
| Page affichée sur `/`            | `app-config.yaml` (racine)        | `app.extensions`                     | Le catalogue                    |
| Widgets de la page Home          | `app-config.yaml` (racine)        | `app.extensions`                     | Widgets du modèle               |
| Carte "Getting Started"          | `src/modules/home/homeModule.tsx` | Texte `content`                      | Bienvenue Backstage, en anglais |
| Logo, barre ouverte              | `src/modules/nav/LogoFull.tsx`    | SVG et `fill`                        | Logo Backstage, `#7df3e1`       |
| Logo, barre repliée              | `src/modules/nav/LogoIcon.tsx`    | SVG et `fill`                        | Logo Backstage, `#7df3e1`       |
| Menu latéral                     | `src/modules/nav/Sidebar.tsx`     | `SidebarContent`                     | Menu du modèle                  |
| Icônes de l'onglet               | `public/`                         | Fichiers `favicon*`, etc.            | Icônes Backstage                |
| Nom et couleurs sur mobile       | `public/manifest.json`            | `name`, `theme_color`...             | `Backstage`, noir et blanc      |
| Description pour les moteurs     | `public/index.html`               | `<meta name="description">`          | Texte du modèle                 |
| Page de connexion                | `src/App.tsx`                     | `provider.title`, `provider.message` | Carte "GitHub"                  |
| Couleurs, polices, formes        | `src/theme/` (à créer)            | Voir [Theme](theme.md)               | Thème Backstage par défaut      |

Détails des valeurs actuelles:

- **Lien "Support"**: sans réglage, Backstage affiche "Add `app.support` config key" dans son bouton d'aide et ses pages d'erreur.
- **Widgets de la page Home**: liens vers backstage.io, horloges NYC, UTC, STO, TYO, blague aléatoire.
- **Menu latéral**: Search, Home, Catalog, Create, puis le reste par ordre alphabétique, Settings en bas.
- **Icônes de l'onglet**: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `safari-pinned-tab.svg`, `apple-touch-icon.png`, `android-chrome-192x192.png`.
- **Page de connexion**: le titre de la page est `app.title`, le texte de la carte "Sign in using GitHub". Voir [Sign-in page](page-de-connexion.md).

## Details

### Texts (`app-config.yaml`)

Les plus faciles: trois lignes à changer.

```yaml
app:
  title: Mathod.io

organization:
  name: Mathod

mcpActions:
  name: 'Mathod Backstage'
```

`app.title` sert aussi de titre à l'onglet du navigateur: `packages/app/public/index.html` contient `<title><%= config.getOptionalString('app.title') ?? 'Backstage' %></title>`.

Le lien de support se règle au même endroit:

```yaml
app:
  support:
    url: https://github.com/Mathod95/backstage/issues
    items:
      - title: Issues
        icon: github
        links:
          - url: https://github.com/Mathod95/backstage/issues
            title: GitHub Issues
```

### Home page (`app-config.yaml`, `homeModule.tsx`)

Aujourd'hui `/` affiche le catalogue. Pour afficher la page Home à la place, dans `app.extensions`, supprimer le bloc `page:catalog` avec `path: /` et décommenter celui de `page:home`:

```yaml
app:
  extensions:
    - page:home:
        config:
          path: /
```

Les widgets se règlent aussi dans `app.extensions`. Exemples tirés de la doc officielle:

```yaml
app:
  extensions:
    # Désactiver un widget
    - home-page-widget:home/random-joke: false
    # Ses propres liens
    - home-page-widget:home/toolkit:
        config:
          tools:
            - url: https://github.com/Mathod95
              label: GitHub
              icon: github
```

La disposition par défaut (position et taille de chaque widget) est dans `page:home` → `config.defaultConfig`. Chaque personne peut ensuite réorganiser sa propre page.

Les widgets "Most Visited" et "Recently Visited" ne fonctionnent qu'avec le suivi des visites, désactivé par défaut:

```yaml
app:
  extensions:
    - api:home/visits: true
    - app-root-element:home/visit-listener: true
```

Le texte de la carte "Getting Started" est une chaîne Markdown dans `packages/app/src/modules/home/homeModule.tsx`.

### Logos (`packages/app/src/modules/nav/`)

Deux composants, affichés en haut de la barre latérale:

- `LogoFull.tsx` quand la barre est ouverte;
- `LogoIcon.tsx` quand elle est repliée.

Ce sont des SVG dessinés directement dans le code. On peut les remplacer par un autre SVG, ou par une image: l'ancienne instance utilisait `packages/app/src/assets/mathod-logo.png`, toujours présent dans `~/backstage/packages/app/src/assets/`.

### Sidebar (`packages/app/src/modules/nav/Sidebar.tsx`)

Définit ce qui apparaît dans la barre latérale et dans quel ordre. Chaque page s'appelle par son identifiant (`nav.take('page:catalog')`...), `nav.rest()` ajoute toutes les pages restantes.

### Icons (`packages/app/public/`)

Des fichiers image à remplacer par les siens, en gardant les mêmes noms et tailles. `manifest.json` donne le nom et les couleurs quand le site est ajouté à l'écran d'accueil d'un téléphone.

### Theme

Ce Backstage mélange trois systèmes d'affichage: MUI v4 (`@material-ui/core` 4.12.4), MUI v5 (`@mui/material` 5.18.0) et BUI (`@backstage/ui` 0.18.0). Tout ce qui touche à l'apparence générale (couleurs, polices, arrondis, ombres, style des boutons, des cartes, des menus...) se règle dans le thème. Détails dans [Theme](theme.md).

### Sign-in page

Titre, carte, bouton, fond, disposition: voir [Sign-in page](page-de-connexion.md).

## Previous instance

D'après l'[historique de l'ancienne instance](../../historique-ancienne-instance.md): titre `Mathod.io` (`app.title`), logos de la barre latérale (`LogoFull.tsx`, `LogoIcon.tsx`) et page d'accueil personnalisée avec le logo (`homeModule.tsx`, image `mathod-logo.png`). Le code est encore dans `~/backstage` et peut servir de point de départ.

## Sources

- Page d'accueil (nouveau système frontend): <https://backstage.io/docs/getting-started/homepage>
- Apparence, thèmes BUI et MUI: <https://backstage.io/docs/conf/user-interface>
- Réglages `app.*` (dont `app.support`): schéma `node_modules/@backstage/core-app-api/config.schema.json`
- `ThemeBlueprint`: `node_modules/@backstage/plugin-app-react/dist/index.d.ts`
