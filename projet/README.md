# Cambium Network Control

Frontend Next.js 15 avec TypeScript, Apollo Client, Tailwind CSS 4 et composants UI inspirés de shadcn/ui.

## Démarrage

Depuis ce dossier :

```bash
bun install
bun run dev
```

L’interface démarre sur [http://localhost:3000](http://localhost:3000). Le backend GraphQL doit être lancé sur `http://localhost:4000/graphql`.

Pour utiliser une autre URL, copiez `.env.local.example` vers `.env.local` et définissez `NEXT_PUBLIC_GRAPHQL_URL`.

## Vérification

```bash
bun run build
```
