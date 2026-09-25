---
title: Branding
description: L'identité visible de Backstage, noms, logos, icônes, page d'accueil et menu
icon: material/tag-text
status: draft
createdAt: 2026-09-25
modifyAt: 2026-09-25
todo: []
---

# Branding

> L'identité visible de Backstage: noms, logos, icônes, page d'accueil et menu latéral.

Tout est dans le code ou dans `app-config.yaml`, donc dans l'image: chaque changement demande un rebuild et un redéploiement. Le mieux est de regrouper les changements dans un seul lot. Les noms affichés (`app.title`, `organization.name`) sont dans [Settings](../settings.md#app). Les couleurs et les formes sont dans [Theme](theme.md).

## Map

Les chemins de fichiers sont relatifs à `packages/app/`, sauf `app-config.yaml` (à la racine du repo).

| Element                      | File                              | Setting                     | Current value                   |
| ---------------------------- | --------------------------------- | --------------------------- | ------------------------------- |
| Lien "Support"               | `app-config.yaml`                 | `app.support`               | Non défini                      |
| Page affichée sur `/`        | `app-config.yaml`                 | `app.extensions`            | Le catalogue                    |
| Widgets de la page Home      | `app-config.yaml`                 | `app.extensions`            | Widgets du modèle               |
| Carte "Getting Started"      | `src/modules/home/homeModule.tsx` | Texte `content`             | Bienvenue Backstage, en anglais |
| Logo, barre ouverte          | `src/modules/nav/LogoFull.tsx`    | SVG                         | Logo `mathod`, `#10b981`        |
| Logo, barre repliée          | `src/modules/nav/LogoIcon.tsx`    | SVG                         | Icône terminal, `#10b981`       |
| Menu latéral                 | `src/modules/nav/Sidebar.tsx`     | `SidebarContent`            | Menu du modèle                  |
| Icônes de l'onglet           | `public/`                         | Fichiers `favicon*`, etc.   | Icônes Backstage                |
| Nom et couleurs sur mobile   | `public/manifest.json`            | `name`, `theme_color`...    | `Backstage`, noir et blanc      |
| Description pour les moteurs | `public/index.html`               | `<meta name="description">` | Texte du modèle                 |

## Support link

Sans réglage, Backstage affiche "Add `app.support` config key" dans son bouton d'aide et ses pages d'erreur. Exemple de réglage:

```yaml title="app-config.yaml"
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

## Home page

Aujourd'hui `/` affiche le catalogue. Pour afficher la page Home à la place, dans `app.extensions` de `app-config.yaml`, supprimer le bloc `page:catalog` avec `path: /` et décommenter celui de `page:home`:

```yaml title="app-config.yaml"
app:
  extensions:
    - page:home:
        config:
          path: /
```

Les widgets se règlent aussi dans `app.extensions`. Aujourd'hui: liens vers backstage.io, horloges NYC, UTC, STO, TYO, blague aléatoire. Exemples tirés de la doc officielle:

```yaml title="app-config.yaml"
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

```yaml title="app-config.yaml"
app:
  extensions:
    - api:home/visits: true
    - app-root-element:home/visit-listener: true
```

Le texte de la carte "Getting Started" est une chaîne Markdown dans `packages/app/src/modules/home/homeModule.tsx`.

## Logos

Deux composants, dans `packages/app/src/modules/nav/`, affichés en haut de la barre latérale:

- `LogoFull.tsx` quand la barre est ouverte;
- `LogoIcon.tsx` quand elle est repliée.

Ce sont des SVG dessinés directement dans le code. On peut les remplacer par un autre SVG, ou par une image.

Logo retenu le 2026-09-24 parmi plusieurs maquettes (canevas privé: <https://claude.ai/artifact/3QJf169uD7fs1yw2xS5uXa>):

- **Icône**: une fenêtre de terminal avec une invite `>_`, en vert émeraude `#10b981` (constante `LOGO_COLOR` dans `LogoIcon.tsx`).
- **Logo complet**: l'icône suivie du texte `mathod`, en JetBrains Mono Bold, blanc sur la barre latérale sombre.
- **Pas de police à charger**: le texte `mathod` est converti en tracé SVG dans `LogoFull.tsx`. Pour changer le texte, il faut regénérer ce tracé.

Appliqué dans le repo, pas encore déployé ni vérifié dans Backstage.

## Sidebar

`packages/app/src/modules/nav/Sidebar.tsx` définit ce qui apparaît dans la barre latérale et dans quel ordre. Chaque page s'appelle par son identifiant (`nav.take('page:catalog')`...), `nav.rest()` ajoute toutes les pages restantes. Aujourd'hui: Search, Home, Catalog, Create, puis le reste par ordre alphabétique, Settings en bas.

## Icons

Des fichiers image dans `packages/app/public/`, à remplacer par les siens, en gardant les mêmes noms et tailles: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `safari-pinned-tab.svg`, `apple-touch-icon.png`, `android-chrome-192x192.png`. `manifest.json` donne le nom et les couleurs quand le site est ajouté à l'écran d'accueil d'un téléphone.

## Sources

- Page d'accueil (nouveau système frontend): <https://backstage.io/docs/getting-started/homepage>
- Réglages `app.*` (dont `app.support`): schéma `node_modules/@backstage/core-app-api/config.schema.json`
