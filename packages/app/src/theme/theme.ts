import {
  createUnifiedTheme,
  genPageTheme,
  pageTheme,
  palettes,
} from '@backstage/theme';

// "Emerald" theme (MUI v4 and v5), see docs/backstage/personnalisation/emerald-theme.md
// Same colors as theme.css (BUI)

// Page banners: the same emerald gradient for every page type, default shapes kept
const emeraldPageTheme = Object.fromEntries(
  Object.entries(pageTheme).map(([type, { shape }]) => [
    type,
    genPageTheme({ colors: ['#064e3b', '#047857'], shape }),
  ]),
);

export const emeraldLightTheme = createUnifiedTheme({
  palette: {
    ...palettes.light,
    primary: { main: '#047857' },
    background: { default: '#f6f7f9', paper: '#ffffff' },
    border: '#e2e4e8',
    textSubtle: '#5b6475',
    link: '#047857',
    linkHover: '#065f46',
    navigation: {
      ...palettes.light.navigation,
      background: '#111418',
      indicator: '#10b981',
      color: '#b4bcc6',
      selectedColor: '#ffffff',
      navItem: { hoverBackground: '#1f242b' },
      submenu: { background: '#1f242b' },
    },
    tabbar: { indicator: '#047857' },
  },
  defaultPageTheme: 'home',
  pageTheme: emeraldPageTheme,
});

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
