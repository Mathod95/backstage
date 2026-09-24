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

| Champ | Obligatoire | Valeur |
|---|---|---|
| `title` | Oui | Titre court de la page |
| `description` | Oui, peut rester vide | Une phrase qui résume la page. Remplie, elle devient la description de la page dans le HTML généré (`<meta name="description">`) |
| `icon` | Oui, peut rester vide | Icône affichée devant le titre de la page dans le menu, par son nom, par exemple `material/cog`. Icônes disponibles: celles de Material Design (`material/...`, liste sur <https://pictogrammers.com/library/mdi/>), FontAwesome (`fontawesome/...`) et Octicons (`octicons/...`), fournies par mkdocs-material |
| `status` | Oui | `draft`, `review` ou `done` (voir plus bas) |
| `date` | Oui | Date de la dernière mise à jour, au format `AAAA-MM-JJ` (par exemple `2026-09-24`) |
| `todo` | Oui | Ce qui reste à faire sur la page. Liste vide s'il n'y a rien: `todo: []` |

### Statuts

| Statut | Sens |
|---|---|
| `draft` | Brouillon: la page est en cours d'écriture, son contenu peut être incomplet ou changer |
| `review` | À relire: la page est complète et attend une relecture |
| `done` | Terminée: la page est relue et à jour |

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

Après avoir écrit ou modifié un front matter, construire la doc en local et vérifier que l'en-tête n'apparaît pas en haut de la page:

```bash
python3 -m venv .venv && .venv/bin/pip install mkdocs-techdocs-core==1.7.1
.venv/bin/mkdocs serve
```
