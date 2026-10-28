import { createServer } from 'http';
import { createYoga } from 'graphql-yoga';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from '@/infrastructure/graphql/schema';
import { resolvers } from '@/infrastructure/graphql/resolvers';
import { createContext } from '@/infrastructure/graphql/context';
import dotenv from 'dotenv';

dotenv.config();

const schema = makeExecutableSchema({ typeDefs, resolvers });
const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (corsOrigins.length === 0) {
  throw new Error('CORS_ORIGIN must contain at least one allowed frontend origin');
}

const yoga = createYoga({
  schema,
  cors: { origin: corsOrigins },
  context: (ctx) => createContext(ctx),
});

const server = createServer(yoga);
const port = Number(process.env.PORT ?? 4000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is déjà utilisé. Libère le port ou change la variable d'environnement PORT.`);
  } else {
    console.error('Erreur serveur:', err);
  }
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  console.error('Exception non capturée:', err);
  process.exit(1);
});

server.listen(port, () => {
  console.log(`GraphQL server running on http://localhost:${port}/graphql`);
});