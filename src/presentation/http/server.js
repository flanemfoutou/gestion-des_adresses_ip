import { createServer } from 'http';
import { createYoga } from 'graphql-yoga';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from '@/infrastructure/graphql/schema';
import { resolvers } from '@/infrastructure/graphql/resolvers';
import { createContext } from '@/infrastructure/graphql/context';
import dotenv from 'dotenv';
dotenv.config();
const schema = makeExecutableSchema({ typeDefs, resolvers });
const yoga = createYoga({
    schema,
    context: (ctx) => createContext(ctx),
});
const server = createServer(yoga);
const PORT = process.env.PORT ?? 4000;
server.listen(PORT, () => {
    console.log(`GraphQL server running on http://localhost:${PORT}/graphql`);
});
