---
title: Rules
description: Règles de rédaction de cette documentation
icon: material/format-list-checks
status: draft
createdAt: 2026-09-24
modifyAt: 2026-09-24
todo: []
---

# Rules

> Les règles à suivre pour écrire cette documentation. Elles s'ajoutent au fil des demandes, et s'appliquent à toute page créée ou modifiée. La façon technique de créer une page (front matter, syntaxe des tableaux) est dans [Authoring](authoring.md).

## Structure

- La navigation est organisée en **catégories et sous-catégories**.
- Une page ne traite que de son sujet: ce qui relève d'un autre sujet va dans sa propre page (par exemple, le local preview est dans [Configuration](configuration.md), pas dans Authoring).
- Pas de comparatif ni de justification de choix d'outil dans la doc (par exemple une comparaison avec d'autres outils).
- Chaque template a sa propre page dans la doc principale, rangée dans Templates puis sa sous-catégorie (par exemple Templates > GitHub). Le template y renvoie avec les annotations `backstage.io/techdocs-entity` et `backstage.io/techdocs-entity-path`: sa carte et son onglet TechDocs ouvrent directement sa page. Pas de `mkdocs.yml` par template.

## Titles

- Les titres sont en anglais: titre de page, titres de sections, entrées du menu (catégories comprises). Ils sont plus courts la plupart du temps.
- Le texte de la page reste en français.
- Pas de chemin de fichier entre parenthèses dans un titre: le chemin va dans le texte ou dans un tableau.

## Pages

- Chaque page commence, juste sous son titre, par une courte phrase d'intro en citation (`>` devant le texte), qui dit de quoi parle la page:

    ```markdown
    # Authoring

    > Comment créer et écrire une page de cette documentation.
    ```

- Chaque page commence par un front matter complet: `title`, `description`, `icon`, `status`, `createdAt`, `modifyAt`, `todo` (détails dans [Authoring](authoring.md#front-matter)).

## Tables

- Les titres des colonnes sont en anglais, le contenu des cellules reste en français.
- Dans le fichier, les colonnes sont alignées (les `|` les uns sous les autres), comme dans la doc Zensical.
- Les cellules restent courtes: une explication longue va dans un paragraphe sous le tableau.

## Examples

- Plusieurs variantes d'un même exemple (par exemple les alignements gauche, centre, droite) vont dans des **onglets**, chacun avec le code puis son rendu, comme dans la doc Zensical. Pas de doublon: un même exemple n'apparaît qu'une fois.

## Code blocks

- Pour montrer une configuration, un extrait exact du fichier, dans un bloc de code, plutôt qu'un tableau: on voit exactement ce qu'il y a dans le fichier.
- Un bloc de code qui reprend le contenu d'un fichier porte un titre avec le chemin et le nom du fichier:

    ````markdown
    ```yaml title="app-config.yaml"
    app:
      title: Mathod
    ```
    ````

## Content

- Pour un outil ou une fonctionnalité documentée ailleurs, une **brève description** suffit, avec un lien vers la source (README, doc officielle) plutôt que de réexpliquer son usage.
- Chaque titre qui présente un élément externe (plugin, fonctionnalité d'un repo) est un lien vers sa source, pour y arriver en un clic.
- Les sources sont citées en fin de page.
- Les fonctionnalités propres à Zensical (par exemple les tableaux triables) sont signalées, mais pas utilisées tant que la doc est rendue par TechDocs.

## Writing

- Des mots simples, des phrases courtes, peu de jargon.
- Un paragraphe tient sur une seule ligne dans le fichier, sans retour à la ligne forcé.
- Pas d'espace avant les deux-points.
- Pas de tiret cadratin.
