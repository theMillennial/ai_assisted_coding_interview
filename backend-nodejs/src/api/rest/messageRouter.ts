import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import { Message } from '../../models/message';

interface MessageRow {
  id: string;
  content: string;
  created_at: string;
}

export function createMessageRouter(db: Database.Database): Router {
  const router = Router();

  // POST /api/messages - Create a new message
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

  // GET /api/messages/latest - Get latest messages
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

  // GET /api/messages - List messages with pagination
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

  // GET /api/messages/:id - Get message by ID
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
