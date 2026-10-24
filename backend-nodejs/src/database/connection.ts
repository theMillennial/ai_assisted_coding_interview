import Database from 'better-sqlite3';
import { config } from '../config';

let dbInstance: Database.Database | null = null;

export function initDatabase(db: Database.Database, reset = false): void {
  if (reset) {
    db.exec('DROP TABLE IF EXISTS messages;');
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL DEFAULT 'Hello World',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export function getDatabase(dbPath: string = config.dbPath): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
    initDatabase(dbInstance);
  }
  return dbInstance;
}

export function setDatabase(db: Database.Database): void {
  dbInstance = db;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
