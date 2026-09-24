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
| OpenChoreo | Plateforme complète open source (Apache-2.0, CNCF Sandbox) | Oui | Voir ci-dessous |

Parmi ces options, Backstage est le seul portail à la fois gratuit, open source et auto-hébergé.

## Cas d'OpenChoreo

Regardé le 2026-09-24 (version 1.3.0 du 2026-09-19). Projet créé par WSO2, accepté dans la CNCF Sandbox en janvier 2026, 1.0 sortie en avril 2026. Gratuit et open source.

Ce n'est pas un concurrent de Backstage mais une plateforme complète **construite autour de Backstage**: son portail est un Backstage, auquel s'ajoutent sur Kubernetes une CI, du GitOps (FluxCD, Argo), le réseau (Cilium, Envoy), l'observabilité (Prometheus, OpenTelemetry) et des droits d'accès. Son but est de permettre aux équipes de développement d'une organisation de déployer leurs applications sur ses clusters.

Écarté pour ce projet:
- **Autre besoin**: OpenChoreo fait tourner les applications des développeurs. Ici, le but est de générer l'infrastructure de clients (EKS, Crossplane) par des Pull Requests dans leurs propres repos GitOps, sans rien héberger pour eux.
- **Beaucoup plus lourd**: il demande un ou plusieurs clusters Kubernetes avec toute sa pile, là où Backstage seul tourne dans un conteneur sur l'hôte Saltbox.
- **Même base**: son portail étant un Backstage, ce qui est appris et construit ici (templates, catalogue, TechDocs) resterait utile si OpenChoreo devenait pertinent un jour, par exemple comme plateforme proposée à un client.

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
- [OpenChoreo, site officiel](https://openchoreo.dev/) et [dépôt GitHub](https://github.com/openchoreo/openchoreo)
- [OpenChoreo sur le site de la CNCF](https://www.cncf.io/projects/openchoreo/)
- [OpenChoreo 1.0 Brings AI Agents and GitOps to Kubernetes Developer Platforms (InfoQ)](https://www.infoq.com/news/2026/04/openchoreo-10/)
