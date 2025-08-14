import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let dbInstance: Database.Database | null = null;

const getDatabasePath = (): string => {
  const envPath = process.env.SQLITE_DB_PATH || path.resolve(process.cwd(), 'data', 'app.db');
  const dir = path.dirname(envPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return envPath;
};

export const initDb = (): Database.Database => {
  if (dbInstance) return dbInstance;

  const dbPath = getDatabasePath();
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      apis TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      revoked_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS token_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      requested_apis TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
      admin_note TEXT,
      token_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_token_requests_user_id ON token_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_token_requests_status ON token_requests(status);
  `);

  dbInstance = db;
  return dbInstance;
};

export const getDb = (): Database.Database => {
  if (!dbInstance) {
    return initDb();
  }
  return dbInstance;
};