---
title: Authoring
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

### Vérifier

Après avoir écrit ou modifié un front matter, construire la doc en local et vérifier que l'en-tête n'apparaît pas en haut de la page:

```bash
python3 -m venv .venv && .venv/bin/pip install mkdocs-techdocs-core==1.7.1
.venv/bin/mkdocs serve
```
