import crypto from 'crypto';
import Database from 'better-sqlite3';

export function seedDatabase(db: Database.Database): void {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number };
  if (countRow.count === 0) {
    const insert = db.prepare(`
      INSERT INTO messages (id, content, created_at)
      VALUES (?, ?, ?)
    `);
    insert.run(crypto.randomUUID(), 'Hello World', new Date().toISOString());
  }
}
