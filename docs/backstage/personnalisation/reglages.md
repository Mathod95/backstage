---
title: Settings
status: draft
date: 2026-09-24
todo:
  - "[ ] Restructurer convenablement les tableaux"
  - "[ ] Les titres des tableau en anglais"
---

# Où sont les réglages

Carte de tout ce qu'on peut personnaliser dans l'interface, avec le fichier où ça se règle et la valeur actuelle. Rédigé le 2026-09-24 à partir du code du repo (Backstage 1.55.0, nouveau système frontend) et de la documentation officielle (liens en fin de document).

État au 2026-09-24: **rien n'est personnalisé**, tout est resté comme dans le modèle `create-app`.

Tous ces réglages sont dans le code ou dans `app-config.yaml`, donc dans l'image: chaque changement demande un rebuild et un redéploiement (voir [catalogue-depuis-github.md](../../catalogue-depuis-github.md)). Le mieux est donc de regrouper les personnalisations dans un seul lot.

## Deux familles de réglages

La personnalisation se divise en deux parties, qui ne se règlent pas au même endroit:

| Famille | Ce que c'est | Où ça se règle |
|---|---|---|
| **Branding** | L'identité: noms, textes, logos, icônes, liens | Surtout `app-config.yaml` (`app.title`, `organization.name`, `mcpActions`, `app.support`, widgets de la page d'accueil). Aussi les logos dans `packages/app/src/modules/nav/`, les icônes du navigateur dans `packages/app/public/`, et le texte de bienvenue dans `packages/app/src/modules/home/homeModule.tsx` |
| **Theming graphique** | L'apparence: couleurs, polices, arrondis, ombres, style des boutons, cartes, menus | Le thème, dans le dossier prévu `packages/app/src/theme/` (`theme.ts` pour MUI, `theme.css` pour BUI). Voir [Thème (MUI et BUI)](theme.md) |

Le branding se change en quelques lignes, sans rien savoir du thème. Le theming graphique demande d'écrire le thème une fois, puis s'applique à toutes les pages.

## La carte

| Élément | Fichier | Réglage | Valeur actuelle |
|---|---|---|---|
| Nom de l'application (onglet du navigateur, page de connexion) | `app-config.yaml` | `app.title` | `Scaffolded Backstage App` |
| Nom de l'organisation (affiché dans certaines pages, par exemple le catalogue) | `app-config.yaml` | `organization.name` | `My Company` |
| Nom et description pour les assistants IA (MCP) | `app-config.yaml` | `mcpActions.name`, `mcpActions.description` | `My Company Backstage` |
| Lien "Support" (bouton d'aide et pages d'erreur) | `app-config.yaml` | `app.support.url`, `app.support.items` | Non défini (Backstage affiche "Add `app.support` config key") |
| Page d'accueil (ce qui s'affiche sur `/`) | `app-config.yaml` | `app.extensions`, `page:catalog` ou `page:home` avec `path: /` | Le catalogue |
| Widgets de la page Home (liens, horloges, blague...) | `app-config.yaml` | `app.extensions`, `home-page-widget:home/...` et `page:home` → `defaultConfig` | Liens vers backstage.io, horloges NYC, UTC, STO, TYO, blague aléatoire |
| Carte "Getting Started" de la page Home | `packages/app/src/modules/home/homeModule.tsx` | Texte Markdown `content` | Texte de bienvenue Backstage en anglais |
| Logo de la barre latérale, ouverte | `packages/app/src/modules/nav/LogoFull.tsx` | SVG et couleur (`fill`) | Logo Backstage, `#7df3e1` |
| Logo de la barre latérale, repliée | `packages/app/src/modules/nav/LogoIcon.tsx` | SVG et couleur (`fill`) | Logo Backstage, `#7df3e1` |
| Contenu et ordre du menu latéral | `packages/app/src/modules/nav/Sidebar.tsx` | Composant `SidebarContent` | Search, Home, Catalog, Create, puis le reste par ordre alphabétique, Settings en bas |
| Icône de l'onglet du navigateur | `packages/app/public/` | `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `safari-pinned-tab.svg`, `apple-touch-icon.png`, `android-chrome-192x192.png` | Icônes Backstage |
| Nom et couleurs quand on "installe" le site sur mobile | `packages/app/public/manifest.json` | `name`, `short_name`, `theme_color`, `background_color` | `Backstage`, noir et blanc |
| Description de la page (moteurs de recherche) | `packages/app/public/index.html` | `<meta name="description">` | Texte du modèle |
| Page de connexion (titre de la carte, texte) | `packages/app/src/App.tsx` | `SignInPage`, `provider.title` et `provider.message` | Titre de la page = `app.title`, carte "GitHub", texte "Sign in using GitHub". Voir [Page de connexion](page-de-connexion.md) |
| Couleurs, polices, formes, thème clair et sombre | Nouveau dossier prévu `packages/app/src/theme/` | Voir [Thème (MUI et BUI)](theme.md) | Thèmes Backstage par défaut |

## Détails

### Textes simples (`app-config.yaml`)

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

### Page d'accueil (`app-config.yaml` et `homeModule.tsx`)

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

### Menu latéral (`packages/app/src/modules/nav/Sidebar.tsx`)

Définit ce qui apparaît dans la barre latérale et dans quel ordre. Chaque page s'appelle par son identifiant (`nav.take('page:catalog')`...), `nav.rest()` ajoute toutes les pages restantes.

### Icônes du navigateur et du mobile (`packages/app/public/`)

Des fichiers image à remplacer par les siens, en gardant les mêmes noms et tailles. `manifest.json` donne le nom et les couleurs quand le site est ajouté à l'écran d'accueil d'un téléphone.

### Thème: couleurs, polices, formes

Ce Backstage mélange trois systèmes d'affichage: MUI v4 (`@material-ui/core` 4.12.4), MUI v5 (`@mui/material` 5.18.0) et BUI (`@backstage/ui` 0.18.0). Tout ce qui touche à l'apparence générale (couleurs, polices, arrondis, ombres, style des boutons, des cartes, des menus...) se règle dans le thème. Détails dans [Thème (MUI et BUI)](theme.md).

### Page de connexion

Titre, carte, bouton, fond, disposition: voir [Page de connexion](page-de-connexion.md).

## Ce qui était fait sur l'ancienne instance

D'après [historique-ancienne-instance.md](../../historique-ancienne-instance.md): titre `Mathod.io` (`app.title`), logos de la barre latérale (`LogoFull.tsx`, `LogoIcon.tsx`) et page d'accueil personnalisée avec le logo (`homeModule.tsx`, image `mathod-logo.png`). Le code est encore dans `~/backstage` et peut servir de point de départ.

## Sources

- Page d'accueil (nouveau système frontend): <https://backstage.io/docs/getting-started/homepage>
- Apparence, thèmes BUI et MUI: <https://backstage.io/docs/conf/user-interface>
- Réglages `app.*` (dont `app.support`): schéma `node_modules/@backstage/core-app-api/config.schema.json`
- `ThemeBlueprint`: `node_modules/@backstage/plugin-app-react/dist/index.d.ts`
