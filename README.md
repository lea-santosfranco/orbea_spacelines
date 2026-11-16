# Orbéa Spacelines

Site e-commerce d'une agence fictive de tourisme spatial, réalisé dans le cadre du titre CDA.

## Stack technique

- Front : React (Vite), Tailwind CSS
- Back : Node.js, Express
- Base de données : PostgreSQL, Prisma
- Paiement : Stripe (mode test)

## Lancer le projet en local

Prérequis : Node.js 22 ou plus, Docker Desktop démarré, et les fichiers `.env` (racine et `server/`) créés à partir des `.env.example`.

Depuis la racine du projet :

```bash
npm install    # installe les dépendances de l'API et du site, et génère le client Prisma
npm run dev    # démarre PostgreSQL (Docker), l'API (port 3000) et le site (port 5173)
```

Le site est ensuite disponible sur http://localhost:5173.

Première installation uniquement : créer les tables et les données de démonstration avec `npm run db:migrate --prefix server` puis `npm run db:seed --prefix server`.

## Tests

Depuis la racine du projet, avec Docker Desktop démarré :

```bash
npm test
```

Les tests de l'API utilisent une base séparée (`orbea_test`), créée automatiquement : la base de développement n'est jamais modifiée. Ils sont aussi lancés automatiquement par GitHub Actions à chaque push (voir `.github/workflows/ci.yml`).

## Documentation

- [Revue de sécurité (OWASP)](docs/securite.md)
