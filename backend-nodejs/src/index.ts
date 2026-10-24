import { createApp } from './app';
import { config } from './config';

async function startServer() {
  const { app } = await createApp();

  app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
    console.log(`REST API: http://localhost:${config.port}/api/messages/latest`);
    console.log(`GraphQL API: http://localhost:${config.port}/graphql`);
  });
}

startServer().catch((error) => {
  console.error('Error starting server:', error);
  process.exit(1);
});
