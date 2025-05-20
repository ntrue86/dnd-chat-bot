import Database from 'better-sqlite3';
import * as path from 'path';

const CONTEXT_MESSAGE_LIMIT = parseInt(process.env.CONTEXT_MESSAGE_LIMIT || '500', 10);
const dbPath = path.join(__dirname, 'context.sqlite3');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

export function saveMessage(channelId: string, role: 'User' | 'Bot', content: string) {
  db.prepare('INSERT INTO messages (channel_id, role, content) VALUES (?, ?, ?)')
    .run(channelId, role, content);
}

export function loadContext(channelId: string, limit = CONTEXT_MESSAGE_LIMIT): string[] {
  const rows = db.prepare('SELECT role, content FROM messages WHERE channel_id = ? ORDER BY id DESC LIMIT ?')
    .all(channelId, limit)
    .reverse();
  return rows.map(row => `${row.role}: ${row.content}`);
}
