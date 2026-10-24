import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import { Message } from '../../models/message';

/** Raw row shape returned by SQLite for the `messages` table. */
interface MessageRow {
  id: string;
  content: string;
  created_at: string;
}

/**
 * Builds the Express router for the message REST API, mounted at `/api/messages`.
 *
 * Responses include the timestamp as both `createdAt` and `created_at` so clients
 * written against either naming convention keep working.
 *
 * @param db - SQLite connection the handlers read from and write to.
 * @returns A router exposing create, latest, list, and get-by-id endpoints.
 */
export function createMessageRouter(db: Database.Database): Router {
  const router = Router();

  /**
   * POST /api/messages - Create a new message.
   *
   * Body: `{ content?: string }`. Missing or blank content falls back to "Hello World".
   * Responds 200 with the created message, or 422 if `content` is not a string.
   */
  router.post('/', (req: Request, res: Response) => {
    const { content } = req.body || {};
    const id = crypto.randomUUID();
    if (content !== undefined && typeof content !== 'string') {
      res.status(422).json({ detail: 'content must be a string' });
      return;
    }
    const finalContent = content !== undefined && content.trim().length > 0 ? content : 'Hello World';
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO messages (id, content, created_at)
      VALUES (?, ?, ?)
    `).run(id, finalContent, createdAt);

    const message: Message = {
      id,
      content: finalContent,
      createdAt,
      created_at: createdAt,
    };
    res.json(message);
  });

  /**
   * GET /api/messages/latest - Get the most recent messages, newest first.
   *
   * Query: `limit` (default 10; non-numeric values fall back to the default).
   * Registered before `/:id` so "latest" is not treated as a message ID.
   */
  router.get('/latest', (req: Request, res: Response) => {
    const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const limit = isNaN(limitParam) ? 10 : limitParam;

    const rows = db.prepare(`
      SELECT id, content, created_at
      FROM messages
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit) as MessageRow[];

    const messages: Message[] = rows.map((r) => ({
      id: r.id,
      content: r.content,
      createdAt: new Date(r.created_at).toISOString(),
      created_at: new Date(r.created_at).toISOString(),
    }));
    res.json(messages);
  });

  /**
   * GET /api/messages - List messages with offset pagination, in storage order.
   *
   * Query: `skip` (default 0) and `limit` (default 100); non-numeric values fall
   * back to their defaults.
   */
  router.get('/', (req: Request, res: Response) => {
    const skipParam = req.query.skip ? parseInt(req.query.skip as string, 10) : 0;
    const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const skip = isNaN(skipParam) ? 0 : skipParam;
    const limit = isNaN(limitParam) ? 100 : limitParam;

    const rows = db.prepare(`
      SELECT id, content, created_at
      FROM messages
      LIMIT ? OFFSET ?
    `).all(limit, skip) as MessageRow[];

    const messages: Message[] = rows.map((r) => ({
      id: r.id,
      content: r.content,
      createdAt: new Date(r.created_at).toISOString(),
      created_at: new Date(r.created_at).toISOString(),
    }));
    res.json(messages);
  });

  /**
   * GET /api/messages/:id - Get a single message by its UUID.
   *
   * Responds 200 with the message, or 404 `{ detail: 'Message not found' }`.
   */
  router.get('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const row = db.prepare(`
      SELECT id, content, created_at
      FROM messages
      WHERE id = ?
    `).get(id) as MessageRow | undefined;

    if (!row) {
      res.status(404).json({ detail: 'Message not found' });
      return;
    }

    res.json({
      id: row.id,
      content: row.content,
      createdAt: new Date(row.created_at).toISOString(),
      created_at: new Date(row.created_at).toISOString(),
    });
  });

  return router;
}
