/**
 * SQLite database — all data stays on device, never leaves.
 * Tables: messages, reminders, sessions
 */
import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync("light.db");
  await _db.execAsync(`PRAGMA journal_mode = WAL;`);
  await _db.execAsync(`PRAGMA foreign_keys = ON;`);
  await initSchema(_db);
  return _db;
}

async function initSchema(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      app_name TEXT NOT NULL,
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      session_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      fire_at INTEGER NOT NULL,
      repeat_interval TEXT,
      fired INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      summary TEXT
    );

    CREATE TABLE IF NOT EXISTS conversation_turns (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);
    CREATE INDEX IF NOT EXISTS idx_reminders_fire_at ON reminders(fire_at);
    CREATE INDEX IF NOT EXISTS idx_turns_session ON conversation_turns(session_id);
  `);
}

/* ── Messages ─────────────────────────────────────────────── */

export type Message = {
  id: string;
  source: string;
  app_name: string;
  sender: string;
  content: string;
  timestamp: number;
  read: number;
  session_id: string | null;
};

export async function saveMessage(
  msg: Omit<Message, "id">
): Promise<string> {
  const db = await getDb();
  const id = await Crypto.randomUUID();
  await db.runAsync(
    `INSERT OR REPLACE INTO messages
      (id, source, app_name, sender, content, timestamp, read, session_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      msg.source,
      msg.app_name,
      msg.sender,
      msg.content,
      msg.timestamp,
      msg.read,
      msg.session_id ?? null,
    ]
  );
  return id;
}

export async function getUnreadMessages(): Promise<Message[]> {
  const db = await getDb();
  return db.getAllAsync<Message>(
    `SELECT * FROM messages WHERE read = 0 ORDER BY timestamp DESC LIMIT 50`
  );
}

export async function getAllMessages(limit = 100): Promise<Message[]> {
  const db = await getDb();
  return db.getAllAsync<Message>(
    `SELECT * FROM messages ORDER BY timestamp DESC LIMIT ?`,
    [limit]
  );
}

export async function markMessageRead(id: string) {
  const db = await getDb();
  await db.runAsync(`UPDATE messages SET read = 1 WHERE id = ?`, [id]);
}

export async function markAllRead() {
  const db = await getDb();
  await db.runAsync(`UPDATE messages SET read = 1`);
}

export async function deleteOldMessages(olderThanDays = 7) {
  const db = await getDb();
  const cutoff = Date.now() - olderThanDays * 86400000;
  await db.runAsync(`DELETE FROM messages WHERE timestamp < ?`, [cutoff]);
}

/* ── Reminders ───────────────────────────────────────────── */

export type Reminder = {
  id: string;
  title: string;
  body: string;
  fire_at: number;
  repeat_interval: string | null;
  fired: number;
};

export async function saveReminder(
  r: Omit<Reminder, "id">
): Promise<string> {
  const db = await getDb();
  const id = await Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO reminders (id, title, body, fire_at, repeat_interval, fired)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [id, r.title, r.body, r.fire_at, r.repeat_interval ?? null]
  );
  return id;
}

export async function getPendingReminders(): Promise<Reminder[]> {
  const db = await getDb();
  return db.getAllAsync<Reminder>(
    `SELECT * FROM reminders WHERE fired = 0 ORDER BY fire_at ASC`
  );
}

export async function markReminderFired(id: string) {
  const db = await getDb();
  await db.runAsync(`UPDATE reminders SET fired = 1 WHERE id = ?`, [id]);
}

export async function deleteReminder(id: string) {
  const db = await getDb();
  await db.runAsync(`DELETE FROM reminders WHERE id = ?`, [id]);
}

/* ── Conversation sessions ──────────────────────────────── */

export type Turn = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

export async function startSession(): Promise<string> {
  const db = await getDb();
  const id = await Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO sessions (id, started_at) VALUES (?, ?)`,
    [id, Date.now()]
  );
  return id;
}

export async function endSession(id: string, summary?: string) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE sessions SET ended_at = ?, summary = ? WHERE id = ?`,
    [Date.now(), summary ?? null, id]
  );
}

export async function saveTurn(turn: Omit<Turn, "id">) {
  const db = await getDb();
  const id = await Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO conversation_turns (id, session_id, role, content, timestamp)
     VALUES (?, ?, ?, ?, ?)`,
    [id, turn.session_id, turn.role, turn.content, turn.timestamp]
  );
}

export async function getSessionTurns(session_id: string): Promise<Turn[]> {
  const db = await getDb();
  return db.getAllAsync<Turn>(
    `SELECT * FROM conversation_turns WHERE session_id = ? ORDER BY timestamp ASC`,
    [session_id]
  );
}

/**
 * Forget — wipe all conversation turns for a session.
 * Messages and reminders are kept (they're facts, not chat history).
 */
export async function forgetSession(session_id: string) {
  const db = await getDb();
  await db.runAsync(
    `DELETE FROM conversation_turns WHERE session_id = ?`,
    [session_id]
  );
}

export async function forgetAllSessions() {
  const db = await getDb();
  await db.runAsync(`DELETE FROM conversation_turns`);
  await db.runAsync(`DELETE FROM sessions`);
}
