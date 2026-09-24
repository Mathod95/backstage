# Backstage Mathod

Documentation du Backstage de [backstage.mathod.fr](https://backstage.mathod.fr): ce qui a été fait, pourquoi, et ce qui reste à faire. Chaque changement apporté au projet y est documenté.

Le code est sur GitHub: [Mathod95/backstage](https://github.com/Mathod95/backstage). L'image est publiée sur `ghcr.io/mathod95/backstage` et déployée sur l'hôte Saltbox par le rôle `backstage` du repo [Mathod95/saltbox](https://github.com/Mathod95/saltbox).

## Pages

- [Todo](todo.md): tout ce qui reste à faire ou à décider.
- [Historique de l'ancienne instance](historique-ancienne-instance.md): ce qui existait avant ce repo et ce qui est à reprendre.
- [Retirer les exemples et l'invité](retirer-exemples-et-invite.md): passage à la connexion GitHub uniquement.
- [Catalogue lu depuis GitHub](catalogue-depuis-github.md): pourquoi ajouter un utilisateur ou un template ne demande pas de reconstruire l'image.
- [Retirer SQLite de l'image](retirer-sqlite-de-l-image.md).
- [Personnalisation](personnalisation.md): où se trouvent les réglages (titre, logos, page d'accueil, thème).
- [TechDocs](techdocs.md): comment cette documentation est fabriquée et affichée.

## Modifier cette documentation

Les pages sont des fichiers Markdown dans `docs/`, la navigation est dans `mkdocs.yml` à la racine du repo. Un push sur `main` suffit: Backstage relit la doc sur GitHub et la régénère, sans reconstruire l'image.
