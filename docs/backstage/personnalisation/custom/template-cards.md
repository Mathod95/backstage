---
title: Template cards
description: Conception des cartes sur mesure des templates, sur la page Create
icon: material/card-text
status: draft
createdAt: 2026-09-25
modifyAt: 2026-09-25
todo:
  - "[ ] Choisir l'effet au survol"
  - "[ ] Ajouter l'annotation d'auteur aux templates"
  - "[ ] Vérifier les conditions d'usage des icônes AWS"
  - "[ ] Écrire le composant et le déployer"
---

# Template cards

> La conception des cartes sur mesure qui présentent les templates sur la page Create.

Conçu le 2026-09-25 à partir de maquettes (canevas privé: <https://claude.ai/artifact/2mok8w9CPDgE7QMym7m8N2>). **Pas encore codé**: cette page décrit la carte à réaliser.

## Default card

Sans personnalisation, Backstage dessine chaque carte à partir du fichier `template.yaml` du template:

| Card element                 | Source in `template.yaml`                                     |
| ---------------------------- | ------------------------------------------------------------- |
| Petit texte en haut          | `spec.type`                                                   |
| Titre                        | `metadata.title`                                              |
| Description                  | `metadata.description`                                        |
| Étiquettes                   | `metadata.tags`                                               |
| Liens (dont "View TechDocs") | `metadata.links` et les annotations `backstage.io/techdocs-*` |
| Propriétaire                 | `spec.owner`                                                  |
| Bouton "Choose"              | Ouvre le formulaire (`spec.parameters`)                       |

Les deux icônes en haut à droite (fiche du template, favoris) sont ajoutées par Backstage. Modifier ces champs ne demande qu'un push: les templates sont lus sur GitHub.

La couleur du bandeau dépend de `spec.type`: la carte demande au thème la couleur de ce type (`getPageTheme({ themeId: type })`, dans `CardHeader` de `@backstage/plugin-scaffolder-react`). Types connus du thème par défaut:

| Type            | Color            |
| --------------- | ---------------- |
| `home`          | Vert-bleu (teal) |
| `documentation` | Rose             |
| `tool`          | Violet           |
| `service`       | Bleu marine      |
| `website`       | Bleu vif         |
| `library`       | Rouge rubis      |
| `app`           | Orange           |
| `apis`          | Vert-bleu        |
| `card`          | Vert             |
| `other`         | Gris foncé       |

Un type inconnu (comme `repository`) prend la couleur de `home`.

## Options

| Option            | Result                                   | Requires             |
| ----------------- | ---------------------------------------- | -------------------- |
| Couleur par type  | Un bandeau par catégorie de template     | Thème, un rebuild    |
| Liens avec icônes | Liens en bas de la carte, avec une icône | `template.yaml` seul |
| Carte sur mesure  | Forme, contenu et effets libres          | Code, un rebuild     |

**Retenu: la carte sur mesure.** Dans ce Backstage, le composant `TemplateCard` est déclaré remplaçable: une app du nouveau système frontend peut le remplacer avec l'extension `SwappableComponentBlueprint` (vérifié dans `@backstage/plugin-scaffolder-react`, `alpha.d.ts`). Comme pour une page de connexion sur mesure, c'est un fichier de code en plus, un rebuild une fois, et un peu d'entretien aux mises à jour de Backstage. Ensuite, chaque nouveau template prend l'aspect de la carte sans rebuild.

## Scope

- **Seules les cartes de templates changent**, sur la page Create.
- **Les autres cartes de Backstage** (fiche "About" du catalogue, widgets de la page Home, cartes des plugins) gardent leur forme. Leur style (couleurs, arrondis, bordures, ombres, survol) se règle dans le thème (voir [Theme](../theme.md)).
- **La carte et le thème se décident ensemble**, pour que la page Create reste cohérente avec le reste de Backstage.

## Design

De haut en bas:

1. **En-tête**: une tuile carrée avec le logo de l'outil, puis le titre (`metadata.title`) et, dessous, le `spec.type`.
2. **Description** (`metadata.description`).
3. **Étiquettes** (`metadata.tags`).
4. **Propriétaire et auteur**, collés à gauche: `admins:mathod` (voir [Owner and author](#owner-and-author)).
5. **Boutons**, sur une ligne et dans le même format: Docs et Star en icône seule, Choose avec son texte.

Choix faits en cours de conception:

- **Pas de ligne façon terminal** (`$ crossplane create-vpc`): jugée inutile.
- **Pas d'espace vide** entre la ligne propriétaire et les boutons: la hauteur de la carte suit son contenu.
- **Police**: JetBrains Mono pour le titre, le type, les étiquettes et les boutons, comme le logo `mathod`.
- **Couleur d'accent**: le vert émeraude du logo (voir [Branding](../branding.md#logos)).

### Logos

La tuile affiche le logo de l'outil concerné par le template.

| Logo       | Source                                          | Note                         |
| ---------- | ----------------------------------------------- | ---------------------------- |
| GitHub     | [Simple Icons](https://simpleicons.org/)        |                              |
| Argo       | [Simple Icons](https://simpleicons.org/)        |                              |
| Crossplane | [cncf/artwork](https://github.com/cncf/artwork) | Absent de Simple Icons       |
| AWS        | Simple Icons, version 13 seulement              | Retiré des versions récentes |

Pour AWS, la carte définitive devra utiliser les icônes officielles d'AWS (kit "Architecture Icons") et respecter leurs conditions d'usage.

### Owner and author

Backstage n'a pas de champ "auteur" pour un template: la carte standard affiche `spec.owner`, le propriétaire, c'est-à-dire qui est responsable.

- **Mettre `spec.owner: user:mathod`** afficherait "mathod", mais le template ne serait plus la responsabilité du groupe: à reprendre sur chaque template le jour où quelqu'un rejoint `admins`.
- **Retenu: garder le groupe comme propriétaire et ajouter l'auteur** dans une annotation du template, lue par la carte sur mesure. Affichage: `admins:mathod`, collé à gauche.

Annotation proposée, à ajouter à chaque template:

```yaml
metadata:
  annotations:
    mathod.fr/author: user:mathod
```

### Buttons

| Button | Content        | Action                                |
| ------ | -------------- | ------------------------------------- |
| Docs   | Icône document | Ouvre la page du template dans la doc |
| Star   | Icône étoile   | Ajoute le template aux favoris        |
| Choose | Icône et texte | Ouvre le formulaire du template       |

Docs et Star n'ont pas de texte visible: ils portent un nom caché (`aria-label`) pour les lecteurs d'écran. Le lien Docs suit les annotations `backstage.io/techdocs-entity` et `backstage.io/techdocs-entity-path` (voir [Create repository](../../../templates/github/create-repository.md)).

### Hover effects

Trois effets proposés, un seul à retenir:

| Effect      | Description                                                                  |
| ----------- | ---------------------------------------------------------------------------- |
| Lueur       | La bordure devient verte, un halo vert entoure la carte                      |
| Soulèvement | La carte monte légèrement avec une ombre, la tuile du logo se teinte de vert |
| Balayage    | Un halo vert éclaire le coin haut, la tuile se remplit de vert               |

Dans tous les cas, les boutons s'éclaircissent au survol. Les effets restent discrets et rapides (0,2 à 0,3 seconde): une page de nombreux templates animés fatigue vite.

### Light and dark

Deux versions de la même carte, une pour chaque thème de Backstage:

| Token             | Dark      | Light     |
| ----------------- | --------- | --------- |
| Fond de la page   | `#0b0d10` | `#f4f5f7` |
| Fond de la carte  | `#111418` | `#ffffff` |
| Bordure           | `#262b31` | `#e2e4e8` |
| Titre             | `#ffffff` | `#1f2328` |
| Texte secondaire  | `#8b949e` | `#5b6475` |
| Accent            | `#10b981` | `#047857` |
| Texte des boutons | `#06281d` | `#ffffff` |

En version claire, l'accent est un vert émeraude plus foncé, pour que le texte blanc des boutons reste lisible.

## Mockups

Canevas privé: <https://claude.ai/artifact/2mok8w9CPDgE7QMym7m8N2>

| Board | Content                                              |
| ----- | ---------------------------------------------------- |
| 1     | Carte de base, telle qu'aujourd'hui                  |
| 2 à 6 | Options: couleur par type, liens, cartes sur mesure  |
| 7     | Carte sur mesure: logos, Docs et Star en icônes      |
| 8     | Quatre façons d'afficher le propriétaire et l'auteur |
| 9     | Version sombre, avec les trois effets au survol      |
| 10    | Version claire, avec les mêmes effets                |

## Sources

- Composant `TemplateCard` remplaçable: `node_modules/@backstage/plugin-scaffolder-react/dist/alpha.d.ts`
- Couleur par type: `node_modules/@backstage/plugin-scaffolder-react/dist/next/components/TemplateCard/CardHeader.esm.js` et `node_modules/@backstage/theme/dist/base/pageTheme.esm.js`
- Liens de la carte: `TemplateCardLinks.esm.js`, même dossier
- Logos: [Simple Icons](https://simpleicons.org/), [cncf/artwork](https://github.com/cncf/artwork)
