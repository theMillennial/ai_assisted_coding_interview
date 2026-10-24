import request from 'supertest';
import Database from 'better-sqlite3';
import { createApp, AppContext } from '../src/app';

describe('Brex Interview Playground - backend-nodejs', () => {
  let context: AppContext;
  let testDb: Database.Database;

  beforeEach(async () => {
    // Use an in-memory SQLite database for each test to guarantee isolation
    testDb = new Database(':memory:');
    context = await createApp(testDb);
  });

  afterEach(async () => {
    if (context.apolloServer) {
      await context.apolloServer.stop();
    }
    testDb.close();
  });

  describe('Health Check', () => {
    it('returns status ok', async () => {
      const res = await request(context.app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  describe('Startup', () => {
    it('resets existing data to the single seeded message', async () => {
      await request(context.app).post('/api/messages').send({ content: 'Old message' });
      await context.apolloServer.stop();

      context = await createApp(testDb);
      const res = await request(context.app).get('/api/messages/latest');
      expect(res.body.length).toBe(1);
      expect(res.body[0].content).toBe('Hello World');
    });
  });

  describe('CORS', () => {
    it('allows any localhost port', async () => {
      const res = await request(context.app).get('/health').set('Origin', 'http://localhost:5173');
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('rejects other origins', async () => {
      const res = await request(context.app).get('/health').set('Origin', 'https://evil.example.com');
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('REST API - /api/messages', () => {
    it('GET /api/messages/latest returns seeded message', async () => {
      const res = await request(context.app).get('/api/messages/latest');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].content).toBe('Hello World');
      expect(res.body[0].id).toBeDefined();
      expect(res.body[0].createdAt).toBeDefined();
    });

    it('POST /api/messages creates a message with default content', async () => {
      const res = await request(context.app)
        .post('/api/messages')
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.content).toBe('Hello World');
      expect(res.body.id).toBeDefined();
      expect(res.body.createdAt).toBeDefined();

      const latestRes = await request(context.app).get('/api/messages/latest');
      expect(latestRes.body.length).toBe(2);
    });

    it('POST /api/messages creates a message with custom content', async () => {
      const res = await request(context.app)
        .post('/api/messages')
        .send({ content: 'Custom interview test message' });
      expect(res.status).toBe(200);
      expect(res.body.content).toBe('Custom interview test message');

      const latestRes = await request(context.app).get('/api/messages/latest');
      expect(latestRes.body[0].content).toBe('Custom interview test message');
    });

    it('POST /api/messages rejects non-string content', async () => {
      const res = await request(context.app).post('/api/messages').send({ content: 123 });
      expect(res.status).toBe(422);
      expect(res.body).toEqual({ detail: 'content must be a string' });
    });

    it('GET /api/messages lists all messages with pagination', async () => {
      await request(context.app).post('/api/messages').send({ content: 'Message 2' });
      await request(context.app).post('/api/messages').send({ content: 'Message 3' });

      const res = await request(context.app).get('/api/messages?skip=0&limit=2');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('GET /api/messages/:id returns message by id', async () => {
      const createRes = await request(context.app)
        .post('/api/messages')
        .send({ content: 'Specific message' });
      const id = createRes.body.id;

      const getRes = await request(context.app).get(`/api/messages/${id}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.id).toBe(id);
      expect(getRes.body.content).toBe('Specific message');
    });

    it('GET /api/messages/:id returns 404 if message not found', async () => {
      const res = await request(context.app).get('/api/messages/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ detail: 'Message not found' });
    });
  });

  describe('GraphQL API - /graphql', () => {
    it('executes latestMessages query', async () => {
      const query = `
        query {
          latestMessages(limit: 10) {
            id
            content
            createdAt
          }
        }
      `;

      const res = await request(context.app)
        .post('/graphql')
        .send({ query });

      expect(res.status).toBe(200);
      expect(res.body.errors).toBeUndefined();
      const messages = res.body.data.latestMessages;
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBe(1);
      expect(messages[0].content).toBe('Hello World');
      expect(messages[0].id).toBeDefined();
      expect(messages[0].createdAt).toBeDefined();
    });

    it('executes createMessage mutation', async () => {
      const mutation = `
        mutation {
          createMessage {
            id
            content
            createdAt
          }
        }
      `;

      const res = await request(context.app)
        .post('/graphql')
        .send({ query: mutation });

      expect(res.status).toBe(200);
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.createMessage.content).toBe('Hello World');
      expect(res.body.data.createMessage.id).toBeDefined();
      expect(res.body.data.createMessage.createdAt).toBeDefined();

      // Query latest messages to confirm it was persisted
      const query = `
        query {
          latestMessages(limit: 10) {
            id
            content
          }
        }
      `;
      const queryRes = await request(context.app)
        .post('/graphql')
        .send({ query });

      expect(queryRes.body.data.latestMessages.length).toBe(2);
    });
  });
});
