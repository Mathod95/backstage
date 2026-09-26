---
title: Emerald theme
description: Le thème de couleurs de ce Backstage, clair et sombre, autour du vert émeraude du logo
icon: material/palette-swatch
status: draft
createdAt: 2026-09-26
modifyAt: 2026-09-26
todo:
  - "[ ] Déployer et vérifier les deux thèmes dans Backstage (pages MUI et pages BUI)"
  - "[ ] Décider de la couleur secondaire (rose par défaut en sombre, gardée pour l'instant)"
  - "[ ] Plus tard: arrondis, ombres, polices et style des composants (hors de ce thème)"
---

# Emerald theme

> Le thème de couleurs de ce Backstage: ce qu'il change, ce qu'il ne change pas, ses couleurs en clair et en sombre, et où il se trouve dans le code.

Le fonctionnement général des thèmes (MUI, BUI, ce qu'on peut régler) est dans [Theme](theme.md). Cette page ne décrit que le thème choisi.

## Choice

Trois propositions ont été dessinées, chacune en clair et en sombre, sur la fiche du composant Backstage Mathod:

| Proposal          | Dark                               | Light                                         |
| ----------------- | ---------------------------------- | --------------------------------------------- |
| A. Émeraude sobre | Gris neutres, bandeau vert         | Fond gris très clair, menu latéral noir       |
| B. Graphite       | Gris bleutés, bandeau sans couleur | Tout blanc, menu latéral clair                |
| C. Forêt          | Gris teintés de vert, bandeau vert | Fond légèrement vert, menu latéral vert foncé |

**Retenu: A, Émeraude sobre.** Maquettes sur le canevas privé: <https://claude.ai/artifact/Y2UAxAibuKJPqfKAf2tsb6>

## Scope

Ce thème ne change **que les couleurs**, pour un premier rendu propre. Les réglages plus fins viendront plus tard.

Ce qui change:

- **Les fonds**: fond de page et fond des cartes.
- **La couleur principale**: boutons, liens, onglet actif, éléments sélectionnés.
- **Les textes secondaires et les bordures.**
- **Le menu latéral**: fond, texte, élément sélectionné, survol.
- **Le bandeau en haut des pages**: le même dégradé vert pour tous les types de page (accueil, composant, doc...), avec les formes par défaut de Backstage.
- **Les composants BUI**: mêmes couleurs, pour que les pages BUI et MUI se ressemblent.

Ce qui ne change pas:

- **La police, les arrondis, les ombres, les espacements**: ceux de Backstage par défaut.
- **Le style propre à chaque composant** (boutons, cartes, menus...): rien dans la section `components` du thème.
- **Les couleurs d'état** (succès, alerte, erreur) et les bandeaux d'information: ceux de Backstage.
- **La couleur secondaire**: rose en sombre, bleu en clair, comme par défaut.
- **Le logo et les noms**: voir [Branding](branding.md).
- **Le contenu de la doc TechDocs**: il garde son propre style.

Conséquence sur les cartes de templates: la couleur de leur bandeau dépend du type du template (voir [Template cards](custom/template-cards.md#default-card)). Avec ce thème, tous les types ont le même bandeau vert.

## Colors

En clair, la couleur principale est un vert émeraude plus foncé (`#047857`): le vert du logo (`#10b981`) est trop clair pour du texte sur fond blanc, et le texte blanc sur ce vert se lit mal.

| Token                      | Dark                  | Light                 |
| -------------------------- | --------------------- | --------------------- |
| Fond de la page            | `#0f1115`             | `#f6f7f9`             |
| Fond des cartes            | `#171a1f`             | `#ffffff`             |
| Bordures                   | `#2a2f36`             | `#e2e4e8`             |
| Texte secondaire           | `#9aa3ad`             | `#5b6475`             |
| Couleur principale         | `#10b981`             | `#047857`             |
| Liens                      | `#34d399`             | `#047857`             |
| Liens au survol            | `#6ee7b7`             | `#065f46`             |
| Menu latéral, fond         | `#0b0d10`             | `#111418`             |
| Menu latéral, texte        | `#9aa3ad`             | `#b4bcc6`             |
| Menu latéral, sélection    | `#ffffff`             | `#ffffff`             |
| Menu latéral, repère       | `#10b981`             | `#10b981`             |
| Menu latéral, survol       | `#1a1e24`             | `#1f242b`             |
| Onglet actif, soulignement | `#10b981`             | `#047857`             |
| Bandeau des pages          | `#064e3b` → `#047857` | `#064e3b` → `#047857` |

## Implementation

Le thème vit dans `packages/app/src/theme/`, en deux fichiers avec les mêmes couleurs, parce que ce Backstage mélange MUI et BUI (voir [Theme](theme.md#ui-systems)):

| File        | Content                                                         |
| ----------- | --------------------------------------------------------------- |
| `theme.ts`  | Les deux thèmes MUI (v4 et v5), créés avec `createUnifiedTheme` |
| `theme.css` | Les variables `--bui-*` de BUI, pour le clair et le sombre      |
| `index.tsx` | Le module qui remplace les thèmes clair et sombre par défaut    |

Le module est ajouté aux `features` de `packages/app/src/App.tsx`, et le paquet `@backstage/theme` est déclaré dans `packages/app/package.json`.

Les thèmes gardent les noms et identifiants par défaut (`light`, `dark`): le choix déjà fait par chacun dans Settings reste valable.

```tsx title="packages/app/src/theme/index.tsx"
const darkTheme = ThemeBlueprint.make({
  name: 'dark',
  params: {
    theme: {
      id: 'dark',
      title: 'Dark Theme',
      variant: 'dark',
      icon: <DarkIcon />,
      Provider: ({ children }) => (
        <UnifiedThemeProvider theme={emeraldDarkTheme} children={children} />
      ),
    },
  },
});
```

Le thème part de la palette par défaut de Backstage (`palettes.dark`) et ne remplace que les couleurs listées plus haut:

```ts title="packages/app/src/theme/theme.ts"
export const emeraldDarkTheme = createUnifiedTheme({
  palette: {
    ...palettes.dark,
    primary: { main: '#10b981' },
    background: { default: '#0f1115', paper: '#171a1f' },
    border: '#2a2f36',
    textSubtle: '#9aa3ad',
    link: '#34d399',
    linkHover: '#6ee7b7',
    navigation: {
      ...palettes.dark.navigation,
      background: '#0b0d10',
      indicator: '#10b981',
      color: '#9aa3ad',
      selectedColor: '#ffffff',
      navItem: { hoverBackground: '#1a1e24' },
      submenu: { background: '#1a1e24' },
    },
    tabbar: { indicator: '#10b981' },
  },
  defaultPageTheme: 'home',
  pageTheme: emeraldPageTheme,
});
```

Côté BUI, le fichier CSS est écrit hors de tout `@layer`: il passe devant les valeurs par défaut de BUI (rangées dans `@layer tokens`), quel que soit l'ordre des imports.

```css title="packages/app/src/theme/theme.css"
[data-theme-mode='dark'] {
  --bui-bg-app: #0f1115;
  --bui-bg-neutral-1: #171a1f;
  --bui-fg-primary: #e6e8eb;
  --bui-fg-secondary: #9aa3ad;
  --bui-border-1: #2a2f36;
  --bui-bg-solid: #10b981;
  --bui-fg-solid: #06281d;
}
```

L'extrait ne montre qu'une partie des variables: le fichier règle aussi les autres fonds BUI, le survol des boutons et le contour de focus, pour le clair et le sombre.

## Sources

- Apparence, thèmes BUI et MUI: <https://backstage.io/docs/conf/user-interface>
- Thèmes par défaut du nouveau système frontend: `node_modules/@backstage/plugin-app/dist/extensions/AppThemeApi.esm.js`
- Palettes et bandeaux par défaut: `node_modules/@backstage/theme/dist/base/palettes.esm.js` et `pageTheme.esm.js`
- Variables BUI: `node_modules/@backstage/ui/dist/css/styles.css`
