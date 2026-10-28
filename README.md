# Cambium IPAM

Application de gestion des adresses IP avec une interface Next.js, une API GraphQL et une base PostgreSQL (Neon).

## Logique du projet

Le parcours d'une requête est le suivant :

1. Le frontend Next.js appelle l'API GraphQL avec Apollo Client.
2. GraphQL valide la requête à partir de `src/infrastructure/graphql/schema.ts`.
3. Les resolvers délèguent les opérations aux use cases et aux repositories fournis par `src/infrastructure/graphql/context.ts`.
4. Les use cases et services applicatifs appliquent les règles métier; les entités du domaine protègent leurs invariants.
5. Les repositories PostgreSQL utilisent Drizzle et le schéma de `src/infrastructure/db/schema.ts` pour lire et écrire dans la base.

Gardez cette direction de dépendance : le domaine ne dépend ni de GraphQL, ni de Drizzle, ni du frontend. Les resolvers font le lien entre le transport GraphQL et les contrats applicatifs; ils ne doivent pas contenir de requêtes SQL. Le TypeScript est la source de vérité du backend : les fichiers JavaScript générés ne sont pas conservés.

## Prérequis

- Bun
- Une base PostgreSQL accessible par le backend

## Configuration du backend et de la base

À la racine du dépôt, créez `.env` à partir de `.env.example`, puis renseignez `DATABASE_URL` et remplacez `JWT_SECRET` par une valeur aléatoire propre à votre environnement. Ne partagez pas ce fichier.

Les migrations ne sont pas exécutées automatiquement au démarrage. Pour une base existante, vérifiez d’abord que les migrations du dépôt correspondent à son schéma avant de lancer `bun run db:migrate`.

Les coordonnées des bases, points d’accès et CPE sont déjà présentes dans le schéma initial. La migration additive `0002_geolocation_coordinates.sql` ajoute les colonnes nullable de latitude, longitude et altitude aux clients; elle utilise `IF NOT EXISTS` pour ne pas écraser des colonnes déjà créées. Après sauvegarde et vérification de l’URL, appliquez les migrations depuis la racine avec `bun run db:migrate`. Aucune donnée existante n’est remplacée.

Démarrez ensuite l’API depuis la racine :

```powershell
bun install
bun run dev
```

L’API GraphQL est disponible sur `http://localhost:4000/graphql`. La requête `health` vérifie également l’accès à PostgreSQL.

## Configuration et démarrage du frontend

Dans un second terminal :

```powershell
Set-Location .\projet
bun install
Copy-Item .env.local.example .env.local
bun run dev
```

Le frontend est accessible sur `http://localhost:3000`. `NEXT_PUBLIC_GRAPHQL_URL` dans `projet/.env.local` indique l’URL de l’API. Pour un déploiement, configurez cette variable avec l’URL publique de GraphQL et `CORS_ORIGIN` avec l’origine du frontend, sans chemin ni barre oblique finale.

## Vérification de la connexion

Une fois les deux services démarrés, le tableau de bord affiche l’état de l’API et de la base. Le client Neon relance au maximum deux fois les requêtes en cas d’erreur DNS (`ENOTFOUND` ou `EAI_AGAIN`), avec un court délai entre les tentatives. Une panne persistante reste une erreur GraphQL et n’est pas remplacée par une réponse de succès.

En cas d’erreur `ENOTFOUND`, vérifiez dans cet ordre :

1. `DATABASE_URL` à la racine du dépôt est la chaîne de connexion PostgreSQL complète copiée depuis le tableau de bord Neon (pas une URL HTTP d’API), sans espaces ni guillemets superflus.
2. Le projet et la branche Neon sont actifs et le hostname dans cette URL correspond bien au projet.
3. La machine a accès à Internet et son DNS peut résoudre les domaines `*.neon.tech`. Essayez un autre réseau ou un DNS autorisé par votre organisation si nécessaire.
4. Le serveur a été redémarré après modification de `.env`.

Une erreur persistante peut aussi signaler un endpoint supprimé ou une interruption DNS/réseau; les relances ne peuvent pas réparer ces causes. Pour vérifier la base sans afficher les identifiants, testez `bun run db:studio` ou exécutez une requête GraphQL `health`.

Dans le code, ajoutez une fonctionnalité à la couche la plus appropriée : règle dans le domaine, orchestration dans un use case, accès aux données dans un repository, puis exposition via le schéma et un resolver. Validez et bornez les entrées aux frontières de l'API, utilisez des erreurs GraphQL explicites pour les saisies invalides et ne retournez jamais de succès factice si la base est inaccessible. Pour les écritures composées touchant plusieurs enregistrements, utilisez une transaction lorsque le pilote PostgreSQL le permet afin d'éviter les états partiellement enregistrés.

Pour compiler le frontend :

```powershell
Set-Location .\projet
bun run build
```
