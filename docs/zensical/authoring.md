---
title: Authoring
description: Comment créer et écrire une page de cette documentation
icon: material/pencil
status: draft
date: 2026-09-24
todo: []
---

# Authoring

Comment créer et écrire une page de cette documentation. Toute nouvelle page, et toute page modifiée, suit ces règles.

## Front matter

Chaque page commence par un en-tête YAML, le front matter, placé tout en haut du fichier entre deux lignes `---`. Il décrit la page elle-même: il ne s'affiche pas dans la page et ne change pas le titre du menu, qui est fixé dans `mkdocs.yml`.

```yaml
---
title: Settings
description: 
icon: 
status: draft
date: 2026-09-24
todo:
  - "[ ] Restructurer convenablement les tableaux"
  - "[x] Les titres des tableaux en anglais"
---
```

### Champs

| Champ         | Obligatoire           | Valeur                                                            |
| ------------- | --------------------- | ----------------------------------------------------------------- |
| `title`       | Oui                   | Titre court de la page                                            |
| `description` | Oui, peut rester vide | Une phrase qui résume la page                                     |
| `icon`        | Oui, peut rester vide | Icône devant le titre de la page dans le menu, ex. `material/cog` |
| `status`      | Oui                   | `draft`, `review` ou `done` (voir plus bas)                       |
| `date`        | Oui                   | Date de la dernière mise à jour, au format `AAAA-MM-JJ`           |
| `todo`        | Oui                   | Ce qui reste à faire sur la page, `todo: []` s'il n'y a rien      |

Remplie, `description` devient la description de la page dans le HTML généré (`<meta name="description">`).

Les icônes disponibles pour `icon` sont celles fournies par mkdocs-material:

| Famille         | Préfixe           | Liste                                    |
| --------------- | ----------------- | ---------------------------------------- |
| Material Design | `material/...`    | <https://pictogrammers.com/library/mdi/> |
| FontAwesome     | `fontawesome/...` | <https://fontawesome.com/search?ic=free> |
| Octicons        | `octicons/...`    | <https://primer.style/foundations/icons> |

### Statuts

| Statut   | Sens                                                                 |
| -------- | -------------------------------------------------------------------- |
| `draft`  | Brouillon: la page est en cours d'écriture, son contenu peut changer |
| `review` | À relire: la page est complète et attend une relecture               |
| `done`   | Terminée: la page est relue et à jour                                |

### Écrire la liste `todo`

Chaque tâche est une ligne entre guillemets, qui commence par `[ ]` (à faire) ou `[x]` (fait):

```yaml
todo:
  - "[ ] Tâche à faire"
  - "[x] Tâche faite"
```

**Les guillemets sont obligatoires.** En YAML, `[ ]` sans guillemets veut dire "liste vide": `- [ ] Tâche` est invalide. MkDocs n'arrive alors pas à lire l'en-tête et l'affiche comme du texte brut en haut de la page, sans aucun avertissement.

Sans tâche, écrire `todo: []`. Un `todo:` laissé vide fonctionne aussi (vérifié), mais `[]` montre clairement que la liste est vide.

### Champs vides

Un champ vide ne casse pas la page. Vérifié le 2026-09-24 avec le générateur de Backstage (`mkdocs-techdocs-core` 1.7.1), sur toutes ces formes:

```yaml
description:
icon:
todo:
todo: []
description: ""
icon: ""
```

Dans tous les cas, la page se construit sans erreur ni avertissement, l'en-tête reste invisible et le contenu s'affiche normalement. Un champ vide n'a simplement aucun effet (pas d'icône, pas de description).

Testé aussi avec des champs remplis: `description: Une description` apparaît bien dans le HTML généré, et `icon: material/cog` affiche l'icône devant le titre dans le menu. Ces deux effets ont été vérifiés sur le site généré par MkDocs, pas encore dans l'affichage de TechDocs dans Backstage.

### Vérifier

Après avoir écrit ou modifié un front matter, vérifier dans l'aperçu local que l'en-tête n'apparaît pas en haut de la page (voir [Configuration](configuration.md#apercu-local)).

## Data tables

Les tableaux s'écrivent en Markdown, avec des `|` entre les colonnes et une ligne de séparation sous l'en-tête. Ils acceptent du Markdown dans les cellules, par exemple du `code`. Source: [Data tables, doc Zensical](https://zensical.org/docs/authoring/data-tables/).

### Usage

Dans le fichier, les colonnes sont **alignées**: chaque cellule est complétée par des espaces pour que les `|` tombent les uns sous les autres, avec un espace de chaque côté. Le rendu est le même, mais le fichier reste lisible.

Garder des cellules courtes: une explication longue va dans un paragraphe sous le tableau plutôt que dans une cellule.

L'alignement du texte dans une colonne se règle avec des `:` dans la ligne de séparation: au début pour aligner à gauche, aux deux bouts pour centrer, à la fin pour aligner à droite.

=== "Left"

    ``` markdown hl_lines="2" title="Data table, columns aligned to left"
    | Method   | Description     |
    | :------- | :-------------- |
    | `GET`    | Fetch resource  |
    | `PUT`    | Update resource |
    | `DELETE` | Delete resource |
    ```

    <div class="result" markdown>

    | Method   | Description     |
    | :------- | :-------------- |
    | `GET`    | Fetch resource  |
    | `PUT`    | Update resource |
    | `DELETE` | Delete resource |

    </div>

=== "Center"

    ``` markdown hl_lines="2" title="Data table, columns centered"
    |  Method  |   Description   |
    | :------: | :-------------: |
    |  `GET`   | Fetch resource  |
    |  `PUT`   | Update resource |
    | `DELETE` | Delete resource |
    ```

    <div class="result" markdown>

    |  Method  |   Description   |
    | :------: | :-------------: |
    |  `GET`   | Fetch resource  |
    |  `PUT`   | Update resource |
    | `DELETE` | Delete resource |

    </div>

=== "Right"

    ``` markdown hl_lines="2" title="Data table, columns aligned to right"
    |   Method |     Description |
    | -------: | --------------: |
    |    `GET` |  Fetch resource |
    |    `PUT` | Update resource |
    | `DELETE` | Delete resource |
    ```

    <div class="result" markdown>

    |   Method |     Description |
    | -------: | --------------: |
    |    `GET` |  Fetch resource |
    |    `PUT` | Update resource |
    | `DELETE` | Delete resource |

    </div>

!!! note "Tableaux triables"
    Zensical permet de rendre un tableau triable en cliquant sur l'en-tête d'une colonne (bibliothèque tablesort, ajoutée par `extra_javascript`). On ne l'utilisera qu'une fois la doc passée sur Zensical: voir [TechDocs, avenir de MkDocs et Zensical](../techdocs.md#avenir-de-mkdocs-et-zensical).
