import crypto from 'crypto';
import Database from 'better-sqlite3';
import { Message } from '../../models/message';

interface MessageRow {
  id: string;
  content: string;
  created_at: string;
}

export function createResolvers(db: Database.Database) {
  return {
    Query: {
      latestMessages: (_: unknown, args: { limit?: number }): Message[] => {
        const limit = args.limit ?? 10;
        const rows = db.prepare(`
          SELECT id, content, created_at
          FROM messages
          ORDER BY created_at DESC
          LIMIT ?
        `).all(limit) as MessageRow[];

        return rows.map((r) => ({
          id: r.id,
          content: r.content,
          createdAt: new Date(r.created_at).toISOString(),
          created_at: new Date(r.created_at).toISOString(),
        }));
      },
    },
    Mutation: {
      createMessage: (): Message => {
        const id = crypto.randomUUID();
        const content = 'Hello World';
        const createdAt = new Date().toISOString();

        db.prepare(`
          INSERT INTO messages (id, content, created_at)
          VALUES (?, ?, ?)
        `).run(id, content, createdAt);

        return {
          id,
          content,
          createdAt,
          created_at: createdAt,
        };
      },
    },
  };
}
