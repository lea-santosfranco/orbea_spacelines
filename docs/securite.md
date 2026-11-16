# Revue de sécurité — Orbéa Spacelines

Revue réalisée en s'appuyant sur le **Top 10 OWASP 2021**, catégorie par catégorie : mesures en place dans le code, et limites connues.

## A01 — Contrôle d'accès défaillant

- Routes protégées par des middlewares côté serveur : `requireAuth` (401 si non connecté) et `requireRole('ADMIN')` (403 si le rôle ne correspond pas). Toute l'administration (`/api/admin/*`) est protégée en un seul point.
- Les ressources d'un client sont toujours lues avec son identifiant : `findFirst({ where: { id, userId } })`. Demander la commande d'un autre client renvoie 404 (testé automatiquement).
- Les protections côté React (`RequireAuth`) ne servent qu'au confort d'affichage : la sécurité réelle est faite par l'API.
- Un administrateur ne peut pas désactiver son propre compte ni un autre administrateur.

## A02 — Défaillances cryptographiques

- Mots de passe hachés avec **argon2id** (jamais stockés en clair, jamais renvoyés par l'API).
- Jeton JWT signé en **HS256** avec un secret obligatoire en production ; l'algorithme est imposé à la vérification (refus des jetons `alg: none`).
- Jeton dans un cookie **httpOnly** (inaccessible au JavaScript), **Secure** en production, **SameSite=Lax**.
- Aucune donnée bancaire ne transite par le serveur : le paiement se fait sur la page hébergée par Stripe.

## A03 — Injection

- Toutes les entrées (corps, paramètres d'URL, query string) sont validées par des **schémas Zod** avant d'atteindre les services ; une donnée invalide renvoie 400.
- Requêtes via **Prisma** (requêtes paramétrées). Les statistiques en SQL utilisent `$queryRaw` avec des gabarits paramétrés, jamais de concaténation de chaînes.
- XSS : React échappe tout le contenu affiché ; aucun usage de `dangerouslySetInnerHTML`.

## A04 — Conception non sécurisée

- Les prix et le total d'une commande sont **calculés par le serveur** à partir de la base, jamais envoyés par le navigateur.
- Le stock est revérifié juste avant le paiement, puis décrémenté dans une **transaction** avec une condition `stock >= quantité` ; une contrainte `CHECK (stock >= 0)` en base sert de dernier filet.
- Le passage d'une commande à « Payée » n'est déclenché que par Stripe (webhook signé ou lecture de la session par le serveur), de façon **idempotente**.
- Les transitions de statut d'une commande sont limitées à celles prévues par les règles de gestion.

## A05 — Mauvaise configuration de sécurité

- **Helmet** : en-têtes de sécurité (CSP, `X-Content-Type-Options: nosniff`, suppression de `X-Powered-By`…).
- **CORS** limité à l'adresse du site.
- Corps JSON limité à 100 Ko ; images limitées à 2 Mo.
- En production, les erreurs 500 renvoient un message générique (pas de détail technique ni de pile d'appels).
- Secrets uniquement dans les fichiers `.env`, exclus du dépôt Git (`.env.example` documente les variables sans valeur réelle).

## A06 — Composants vulnérables et obsolètes

- Versions des dépendances figées (`package-lock.json`, installation par `npm ci`).
- `npm audit` sans vulnérabilité au 16/11/2026 ; vérification automatique à chaque push dans l'intégration continue (échec si vulnérabilité « high »).

## A07 — Identification et authentification

- Mot de passe robuste imposé (recommandation CNIL : 12 caractères minimum, 4 types de caractères).
- **Limitation des tentatives** : 5 échecs par IP et par e-mail sur 15 minutes, puis 429 ; limite de 10 inscriptions par heure et par IP ; limite générale de 1 000 requêtes par 15 minutes.
- Message d'erreur identique quel que soit le motif, et temps de réponse égalisé si l'e-mail est inconnu (pas d'énumération des comptes).
- Comptes désactivés ou anonymisés refusés à la connexion, et leurs jetons existants rejetés.

**Limite connue** : le JWT n'est pas révocable côté serveur avant son expiration (7 jours). Amélioration possible : un numéro de version de jeton stocké sur l'utilisateur, incrémenté au changement de mot de passe.

## A08 — Intégrité des logiciels et des données

- Webhook Stripe vérifié par **signature** (`stripe.webhooks.constructEvent` sur le corps brut).
- Upload d'images : types limités (JPEG, PNG, WebP), **vérification de la signature binaire du fichier** (un faux PNG est refusé), nom de fichier généré par le serveur (UUID), texte alternatif obligatoire.

## A09 — Journalisation et surveillance

- Les erreurs serveur (500) sont journalisées ; les erreurs attendues (400, 401, 404) ne polluent pas les journaux.

**Limite connue** : pas encore de journal dédié aux événements de sécurité (échecs de connexion, actions d'administration). À ajouter avant une mise en production réelle.

## A10 — Falsification de requête côté serveur (SSRF)

- Non concerné : le serveur n'effectue aucune requête vers une adresse fournie par l'utilisateur (seul appel sortant : l'API Stripe, à adresse fixe).

## RGPD

- Consentement explicite à l'inscription, date enregistrée (`consent_at`).
- Export des données au format JSON (droit d'accès et de portabilité).
- Suppression du compte par **anonymisation** : données personnelles effacées, commandes conservées sans identité pour les obligations comptables.
- Polices hébergées sur le serveur (pas d'appel à Google Fonts), uniquement des cookies strictement nécessaires.

## Vérifications automatisées

Les tests de l'API (`npm test` dans `server/`) couvrent notamment : 401/403 sur l'administration, accès à la commande d'un autre client, jetons falsifiés et `alg: none`, blocage après 5 échecs, webhook mal signé, faux fichier image, stock jamais négatif.
