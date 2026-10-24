import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import Database from 'better-sqlite3';
import { config } from './config';
import { getDatabase, initDatabase } from './database/connection';
import { seedDatabase } from './database/seed';
import { createMessageRouter } from './api/rest/messageRouter';
import { typeDefs } from './api/graphql/typeDefs';
import { createResolvers } from './api/graphql/resolvers';

export interface AppContext {
  app: express.Express;
  apolloServer: ApolloServer;
  db: Database.Database;
}

export async function createApp(customDb?: Database.Database): Promise<AppContext> {
  const db = customDb || getDatabase();
  // Drop and recreate tables on startup so every run starts fresh (matches Kotlin/Python)
  initDatabase(db, true);
  seedDatabase(db);

  const app = express();

  const allowedOrigins = [config.corsOrigin, 'https://studio.apollographql.com'];
  // Any localhost port, mirroring Kotlin's `http://localhost:[*]` pattern
  const localhostOrigin = /^http:\/\/localhost(:\d+)?$/;

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      callback(null, !origin || localhostOrigin.test(origin) || allowedOrigins.includes(origin));
    },
    credentials: true,
  };

  app.use(cors(corsOptions));
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // REST API routes
  app.use('/api/messages', createMessageRouter(db));

  // GraphQL Apollo Server
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers: createResolvers(db),
  });

  await apolloServer.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(corsOptions),
    express.json(),
    expressMiddleware(apolloServer)
  );

  return { app, apolloServer, db };
}
