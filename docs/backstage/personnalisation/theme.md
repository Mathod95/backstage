# Thème (MUI et BUI)

Comment changer l'apparence de tout Backstage: couleurs, polices, arrondis, ombres, style des boutons, des cartes, des menus, des champs de saisie. Rien n'est encore appliqué: le thème actuel est celui de Backstage par défaut.

Cette page couvre le **theming graphique**. Le **branding** (nom de l'application, nom de l'organisation, logos, icônes, textes) se règle ailleurs, surtout dans `app-config.yaml`: voir [Où sont les réglages](reglages.md#deux-familles-de-reglages).

## Deux systèmes d'affichage en même temps

**Ce Backstage utilise un mélange de MUI et de BUI.** Les deux systèmes cohabitent pendant une période de transition, et MUI y est même présent en deux versions. Versions installées le 2026-09-24 (Backstage 1.55.0):

| Système | Paquet et version | Rôle | Qui l'utilise |
|---|---|---|---|
| **MUI v4** (Material UI) | `@material-ui/core` 4.12.4 | L'ancien système, qui dessine encore la majorité de l'interface: barre latérale, la plupart des pages, boutons, tableaux | La plupart des plugins, et notre propre code (`LogoFull.tsx`, `LogoIcon.tsx`, déclaré dans `packages/app/package.json`) |
| **MUI v5** | `@mui/material` 5.18.0 | Version plus récente de MUI, utilisée par certains plugins | Par exemple `@backstage/plugin-catalog-react` |
| **BUI** (Backstage UI) | `@backstage/ui` 0.18.0 | Le nouveau système, vers lequel Backstage migre petit à petit | Déjà utilisé en partie par le catalogue, les templates (scaffolder) et TechDocs |

Le paquet `@backstage/theme` (0.7.3) fait le lien entre MUI v4 et MUI v5: un thème créé avec sa fonction `createUnifiedTheme` s'applique aux deux versions de MUI à la fois. BUI, lui, se règle à part (voir plus bas).

Selon l'élément de l'écran, c'est l'un ou l'autre qui le dessine. Pour le savoir, ouvrir l'inspecteur du navigateur: un élément dont les classes commencent par `bui-` vient de BUI, sinon c'est MUI.

### On ne peut pas tout passer en BUI

Ce n'est pas nous qui choisissons: les pages de Backstage (catalogue, templates, doc, recherche, paramètres...) sont des plugins écrits par l'équipe Backstage. C'est elle qui les passe de MUI à BUI, plugin par plugin. Retirer MUI casserait toutes les pages qui l'utilisent encore.

Ce qu'on contrôle:
- **Notre propre code** (barre latérale, logos, widget d'accueil, futurs composants): on peut l'écrire en BUI dès maintenant, pour ne pas ajouter de MUI.
- **Les mises à jour**: chaque montée de version (`yarn backstage-cli versions:bump`) apporte les pages que l'équipe a passées en BUI. La part de BUI augmente toute seule.

## Un thème, deux fichiers

Pour que l'apparence soit la même partout, il faut régler les deux systèmes, avec les mêmes valeurs. Le dossier prévu est `packages/app/src/theme/`:

| Fichier | Système | Contenu |
|---|---|---|
| `theme.ts` | MUI v4 et v5 | Le thème créé avec `createUnifiedTheme` (paquet `@backstage/theme`), déclaré dans l'app avec l'extension `ThemeBlueprint` (paquet `@backstage/plugin-app-react`) |
| `theme.css` | BUI | Les variables CSS `--bui-*`, importé dans `App.tsx` |

Une fois ces deux fichiers écrits, toutes les pages suivent le thème: celles en MUI comme celles en BUI, et les pages qui passeront de MUI à BUI plus tard garderont la même apparence sans rien retoucher. Il n'existe pas encore d'outil pour convertir un thème MUI en thème BUI (la doc officielle l'annonce, il n'est pas disponible).

## Ce que le thème permet de changer

### L'apparence, presque tout

Couleurs, bordures, arrondis, espacements, polices, ombres, couleurs au survol, de chaque type d'élément, sur toutes les pages à la fois.

Côté **MUI**, dans `theme.ts`:
- `palette`: les couleurs (principale, secondaire, fond de page, texte, bandeaux d'information...).
- `typography`: la police et la taille des titres.
- `pageTheme` avec `genPageTheme`: le bandeau coloré en haut des pages. On choisit les couleurs du dégradé et la forme (`shapes.wave`, `shapes.round`... ou sa propre image), et on peut donner une couleur différente par type de page (accueil, doc, outils...).
- `components`: le style d'un type d'élément précis, partout. Deux familles de noms:
  - les éléments MUI: `MuiButton`, `MuiMenu`, `MuiSelect`, `MuiInputBase`, `MuiCard`, `MuiTabs`...
  - les éléments propres à Backstage, par exemple `BackstageHeader`, `BackstageSidebar`, `BackstageSidebarItem`, `BackstageSelect`, `BackstageTable`, `BackstageInfoCard`, `BackstageContent`, `BackstageSignInPage` (liste complète dans le type `BackstageOverrides` de `@backstage/core-components`).

Côté **BUI**, dans `theme.css`:
- des variables générales: couleurs de fond (`--bui-bg-*`), de texte (`--bui-fg-*`), arrondis (`--bui-radius-1` à `--bui-radius-6`, `--bui-radius-full`), ombre (`--bui-shadow`), polices (`--bui-font-*`), espacements (`--bui-space-*`);
- une classe par composant, qui commence par `bui-` suivie de son nom: `bui-Button`, `bui-Menu`, `bui-Select`, `bui-SearchField`, `bui-SearchAutocomplete`, `bui-Table`, `bui-Tabs`, `bui-Card`, `bui-TextField`... Les variantes d'un composant se ciblent par ses attributs `data-*` (par exemple `data-disabled`).

Exemple de la doc officielle pour BUI:

```css
[data-theme-mode='light'] {
  --bui-bg-app: #f8f8f8;
  --bui-fg-primary: #000;
}
```

### Ce que le thème ne change pas

- **Le contenu et la disposition**: ce qu'il y a dans un menu, l'ordre des éléments, l'emplacement de la barre de recherche. Pour ça, il faut remplacer le composant lui-même, comme on l'a fait pour la page de connexion (voir [Page de connexion](page-de-connexion.md)). La barre latérale est déjà dans notre code: `packages/app/src/modules/nav/Sidebar.tsx`.
- **Les plugins qui ignorent le thème**: certains plugins écrivent leurs couleurs en dur. C'est rare dans les plugins officiels, à traiter au cas par cas.

## Exemple: le même style pour tous les boutons

Demande type: "boutons arrondis, avec une ombre, qui changent de couleur au survol, partout".

Côté MUI, dans `theme.ts`, section `components`:

```ts
components: {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        '&:hover': { backgroundColor: '#213a99' },
      },
    },
  },
},
```

Côté BUI, dans `theme.css`. Le bouton BUI utilise `--bui-radius-2` pour son arrondi et `--bui-bg-solid` / `--bui-bg-solid-hover` pour sa couleur (vérifié dans `node_modules/@backstage/ui/dist/components/Button/`). Ces variables servent aussi à d'autres composants: pour ne toucher qu'aux boutons, on cible la classe `.bui-Button`:

```css
.bui-Button {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
```

Les valeurs (arrondi, ombre, couleurs) sont les mêmes dans les deux fichiers. Même principe pour les cartes, les menus, les champs de saisie, les onglets.

## Règles de bonne pratique

Tirées notamment de l'article [How to Customize Backstage UI Like a Pro](https://medium.com/@rameshavutu/how-to-customize-backstage-ui-like-a-pro-974f59528583) (avril 2026):
- **Toujours passer par le thème**, jamais par du CSS global qui vise les classes internes de MUI (`.MuiButton-root`...). Ce CSS casse aux mises à jour de Backstage.
- **Ne jamais écrire une couleur en dur** dans un composant: la prendre dans le thème. Sinon le mode sombre et les futurs changements de couleur ne suivent pas.
- **Si un style est répété deux fois, il va dans le thème.**
- **Vérifier le contraste**: au moins 4,5:1 entre le texte et son fond. Ne jamais retirer le contour de focus (`outline: none`), le remplacer par un style avec `:focus-visible`.

Attention en reprenant le code de cet article: son `App.tsx` (`createApp({ apis, themes: [...] })`) est écrit pour l'**ancien** système frontend de Backstage. Ce repo utilise le nouveau: le même thème se déclare avec l'extension `ThemeBlueprint`. Le contenu du thème (`createUnifiedTheme`, `palette`, `components`...) est identique. Ses parties Storybook et bibliothèque de composants partagée visent de grosses équipes, pas une instance solo.

## Sources

- Apparence, thèmes BUI et MUI: <https://backstage.io/docs/conf/user-interface>
- [How to Customize Backstage UI Like a Pro](https://medium.com/@rameshavutu/how-to-customize-backstage-ui-like-a-pro-974f59528583), Ramesh Avutu, avril 2026: bonnes pratiques de thème MUI (`createUnifiedTheme`, surcharges par composant, pièges des mises à jour, accessibilité)
- Versions: `package.json` de chaque paquet dans `node_modules` et `yarn why @mui/material`
- Code du repo (Backstage 1.55.0): `node_modules/@backstage/plugin-app-react/dist/index.d.ts` (`ThemeBlueprint`), `node_modules/@backstage/core-components/dist/index.d.ts` (noms `Backstage*`), `node_modules/@backstage/ui/dist/` (composants et variables BUI)
