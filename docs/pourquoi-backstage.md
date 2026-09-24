# Pourquoi Backstage

Décision confirmée le 2026-09-24, après un tour des alternatives.

## Contrainte

**100% gratuit**, sans offre limitée ni dépendance à un éditeur. S'y ajoutent les principes du projet: auto-hébergé, aucun identifiant client stocké, image déployable ailleurs que sur l'hôte Saltbox.

## Alternatives regardées

| Solution | Type | Gratuit ? | Pourquoi écartée |
|---|---|---|---|
| **Backstage** | Open source, auto-hébergé | Oui, entièrement | Retenu |
| Port | SaaS | Offre gratuite limitée | Pas 100% gratuit, données et workflows chez l'éditeur |
| Cortex, OpsLevel | SaaS | Non | Payants, orientés grandes équipes |
| Roadie | Backstage hébergé | Non | Payant (c'est Backstage sans l'entretien) |
| Compass | SaaS Atlassian | Offre gratuite limitée | Surtout utile dans l'écosystème Jira et Confluence |
| Northflank, Cycloid | Plateformes complètes | Non | Elles font tourner l'infra elles-mêmes, autre approche que les PR vers le repo GitOps du client |

Parmi ces options, Backstage est le seul portail à la fois gratuit, open source et auto-hébergé.

## Pourquoi Backstage convient

- Les Software Templates font exactement le besoin du projet: un formulaire qui génère des manifestes Crossplane et ouvre une Pull Request dans le repo GitOps du client.
- Tout est auto-hébergé: rien ne passe par un tiers.
- C'est l'outil le plus répandu du domaine: savoir le monter et le faire évoluer est un argument auprès des clients.

## Coût accepté

Backstage est un kit à assembler, pas un produit prêt à l'emploi: il faut le configurer, l'entretenir et suivre ses mises à jour (`yarn backstage-cli versions:bump`, voir [todo.md](todo.md)). Pour une seule instance, ce coût reste raisonnable.

## Sources

Comparatifs consultés le 2026-09-24:

- [Top 5 Backstage alternatives for platform engineering teams in 2026 (Northflank)](https://northflank.com/blog/backstage-alternatives)
- [Top internal developer portals in 2026 (Northflank)](https://northflank.com/blog/top-internal-developer-portals)
- [The Best Backstage Alternatives: The 2026 Buyer's Guide (Roadie)](https://roadie.io/blog/backstage-alternatives/)
- [Backstage Alternatives in 2026: Portals and Platforms Compared (Encore)](https://encore.dev/articles/backstage-alternatives)
- [Backstage alternatives: 4 top tools to use instead (OpsLevel)](https://www.opslevel.com/resources/backstage-io-alternatives-4-top-tools-to-use-instead)
