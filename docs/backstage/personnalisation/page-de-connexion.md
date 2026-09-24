# Page de connexion

> Tout ce qui s'affiche sur la page de connexion est modifiable: titre, carte, bouton, texte, fond, bandeau, disposition.

## Aujourd'hui

La page est dessinée par le composant `SignInPage` de Backstage, branché dans `packages/app/src/App.tsx` avec l'extension `SignInPageBlueprint` (mise en place avec GitHub OAuth, voir [Retirer les exemples et l'invité](../../retirer-exemples-et-invite.md)). Elle affiche:
- en haut, le bandeau vert de Backstage avec le titre `app.title` ("Scaffolded Backstage App");
- une carte "GitHub", le texte "Sign in using GitHub" et un bouton "SIGN IN".

## Trois niveaux de personnalisation

### 1. Réglages simples

- **Titre du bandeau**: `app.title` dans `app-config.yaml`.
- **Titre de la carte et texte**: `provider.title` et `provider.message` dans `App.tsx`.

Le composant `SignInPage` n'a pas de réglage de titre ni de centrage quand il n'y a qu'un seul fournisseur de connexion: les réglages `title` et `align` n'existent qu'avec plusieurs fournisseurs (vérifié dans `node_modules/@backstage/core-components/dist/index.d.ts`, types `SingleSignInPageProps` et `MultiSignInPageProps`).

### 2. Le thème

Le thème change aussi cette page (voir [Thème (MUI et BUI)](theme.md)):
- **Bandeau**: couleurs et forme, avec le thème de page `home` (`genPageTheme`).
- **Couleur du fond**: `palette.background.default`.
- **Forme de la carte**: arrondis, ombre, bordure (`MuiCard`, `BackstageInfoCard`).
- **Bouton**: couleur, forme, majuscules ou non (`MuiButton`).
- **Position de la carte**: `BackstageSignInPage`, zones `container` et `item`. Possible, mais c'est du bricolage pour centrer la carte au milieu de l'écran.

### 3. Une page entièrement sur mesure

Le composant donné à `SignInPageBlueprint` peut être n'importe quelle page React. On garde le mécanisme de connexion GitHub (`githubAuthApiRef`) et on dessine tout le reste librement: fond plein écran, logo au centre, carte de n'importe quelle forme, texte du bouton libre. C'est la méthode propre pour une mise en page différente de celle de Backstage.

## Entretien d'une page sur mesure

- **Un seul fichier en plus**: seule la page de connexion est réécrite. Toutes les autres pages restent celles de Backstage, habillées par le thème. Il ne faut jamais refaire les autres pages une à une.
- **Elle suit le thème** si elle prend ses couleurs, sa police et ses arrondis dans le thème au lieu de les écrire en dur. Changer la couleur principale du thème change alors aussi la page de connexion.
- **Aux mises à jour de Backstage**: si la façon de brancher une page de connexion change (`SignInPageBlueprint`, API GitHub), il faut ajuster ce fichier. C'est déjà le cas pour la page GitHub actuelle de `App.tsx`.

## Maquettes

Quatre maquettes ont été faites le 2026-09-24 pour comparer des styles (canevas privé: <https://claude.ai/artifact/FZ7Yya6u18rwZnhdnVY8vt>):

| Maquette | Description | Ce qu'elle demande |
|---|---|---|
| 1. Split | Panneau sombre à gauche (logo, "Mathod.io", phrase d'accroche), connexion à droite sur fond clair | Page sur mesure |
| **2. Carte centrée minimale** | Une carte très arrondie au milieu de l'écran sur fond gris clair, rond avec l'initiale, "Bienvenue sur Mathod.io", un gros bouton plein "Se connecter avec GitHub", un lien "Besoin d'aide ?" | Page sur mesure |
| 3. Terminal | Fond noir, police de code, fausse fenêtre de terminal avec `$ backstage login` et un bouton `[ Entrée ] Se connecter avec GitHub` | Page sur mesure |
| 4. Bandeau revisité | La disposition actuelle avec d'autres couleurs, d'autres formes dans le bandeau, une carte plus arrondie et un bouton en français | Thème seul |

**Retenue: la maquette 2** (choix du 2026-09-24, pas encore appliquée). Sa couleur d'accent sera celle du thème. Le logo reste à fournir: l'initiale "M" est provisoire, l'ancienne instance avait `mathod-logo.png` (`~/backstage/packages/app/src/assets/`).
