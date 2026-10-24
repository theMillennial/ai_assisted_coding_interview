# Brex Interview Playground Backend (Node.js)

An Express and Apollo Server GraphQL implementation of the Brex Interview Playground Node.js Backend with TypeScript and Jest.

## Technologies Used

- Express: Fast, unopinionated web framework for Node.js
- Apollo Server (@apollo/server): Production-ready GraphQL server for Express
- TypeScript: Typed superset of JavaScript
- better-sqlite3: Fast, synchronous SQLite3 client for Node.js
- Jest & ts-jest: Testing framework with TypeScript support
- Supertest: HTTP assertion library for integration testing
- tsx: Fast TypeScript execution and watcher for development

## Project Structure

```
backend-nodejs/
├── src/
│   ├── api/
│   │   ├── graphql/     # GraphQL schema (typeDefs) and resolvers
│   │   └── rest/        # REST API message router
│   ├── config/          # Application configuration (port, DB, CORS)
│   ├── database/        # SQLite connection setup and seed logic
│   ├── models/          # TypeScript domain interfaces and types
│   ├── app.ts           # Express application & Apollo Server factory
│   └── index.ts         # Server entry point
├── tests/               # Jest test suite (REST & GraphQL)
├── jest.config.js       # Jest configuration
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript compiler options
```

## Setup

1. Install dependencies:
   ```bash
   cd backend-nodejs
   npm install
   ```

2. Run the development server (with hot reload):
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Run the production build:
   ```bash
   npm start
   ```

## API Documentation

- REST API: `http://localhost:8080/api/`
  - Get latest messages: `http://localhost:8080/api/messages/latest`
  - List messages (paginated): `http://localhost:8080/api/messages?skip=0&limit=100`
  - Get message by ID: `http://localhost:8080/api/messages/:id`
  - Create message: `POST http://localhost:8080/api/messages`
- GraphQL API & Playground: `http://localhost:8080/graphql`
- Health check: `http://localhost:8080/health`

### Example GraphQL Query

```graphql
query {
  latestMessages(limit: 10) {
    id
    content
    createdAt
  }
}
```

### Example GraphQL Mutation

```graphql
mutation {
  createMessage {
    id
    content
    createdAt
  }
}
```

## Testing

Run the test suite with Jest:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```
