import { env } from 'cloudflare:workers';
import type { ChatGPTUser } from '../app/chatgpt-auth';

let schemaPromise: Promise<void> | null = null;

export function ensureSocialSchema() {
  if (!schemaPromise) schemaPromise = createSocialSchema();
  return schemaPromise;
}

async function createSocialSchema() {
  const db = env.DB;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS scenes (
      id TEXT PRIMARY KEY NOT NULL, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
      source_title TEXT NOT NULL, source_type TEXT NOT NULL, synopsis TEXT NOT NULL,
      genre TEXT NOT NULL, age_rating TEXT NOT NULL, challenge_date TEXT NOT NULL UNIQUE,
      duration_ms INTEGER NOT NULL, video_object_key TEXT, preview_image_object_key TEXT,
      status TEXT NOT NULL DEFAULT 'draft', created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY NOT NULL, scene_id TEXT NOT NULL, name TEXT NOT NULL,
      description TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS script_lines (
      id TEXT PRIMARY KEY NOT NULL, scene_id TEXT NOT NULL, role_id TEXT NOT NULL,
      sequence INTEGER NOT NULL, start_ms INTEGER NOT NULL, end_ms INTEGER NOT NULL,
      text TEXT NOT NULL, direction TEXT,
      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL, auth_user_id TEXT NOT NULL UNIQUE, email TEXT NOT NULL,
      display_name TEXT NOT NULL, bio TEXT, current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0, last_completed_date TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, scene_id TEXT NOT NULL,
      role_id TEXT NOT NULL, mode TEXT NOT NULL, visibility TEXT NOT NULL DEFAULT 'public',
      caption TEXT, status TEXT NOT NULL DEFAULT 'published',
      published_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS submission_audio (
      id TEXT PRIMARY KEY NOT NULL, submission_id TEXT NOT NULL, script_line_id TEXT NOT NULL,
      object_key TEXT NOT NULL UNIQUE, content_type TEXT NOT NULL, size_bytes INTEGER NOT NULL,
      duration_ms INTEGER NOT NULL,
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
      FOREIGN KEY (script_line_id) REFERENCES script_lines(id) ON DELETE RESTRICT
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS daily_completions (
      id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, scene_id TEXT NOT NULL,
      submission_id TEXT NOT NULL, completion_date TEXT NOT NULL,
      completed_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
      UNIQUE (user_id, completion_date)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS reactions (
      id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, submission_id TEXT NOT NULL,
      type TEXT NOT NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
      UNIQUE (user_id, submission_id, type)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY NOT NULL, reporter_user_id TEXT NOT NULL, submission_id TEXT NOT NULL,
      reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
    )`),
  ]);

  await db.batch([
    db.prepare('CREATE INDEX IF NOT EXISTS idx_submissions_scene_published ON submissions(scene_id, published_at)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_submissions_user_published ON submissions(user_id, published_at)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_reactions_submission_id ON reactions(submission_id)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_reports_submission_status ON reports(submission_id, status)'),
  ]);

  await db.batch([
    db.prepare(`INSERT OR IGNORE INTO scenes
      (id, slug, title, source_title, source_type, synopsis, genre, age_rating, challenge_date, duration_ms, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind('challenge-001', 'o-ultimo-sinal', 'O último sinal', 'Cena demonstrativa', 'original',
        'Uma transmissão misteriosa. Uma última chance de ser ouvido.', 'Drama', '12', todayInSaoPaulo(), 18000, 'published'),
    db.prepare('INSERT OR IGNORE INTO roles (id, scene_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)')
      .bind('lia', 'challenge-001', 'Lia', 'Operadora de rádio tentando manter a calma.', 0),
    db.prepare('INSERT OR IGNORE INTO script_lines (id, scene_id, role_id, sequence, start_ms, end_ms, text, direction) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind('line-1', 'challenge-001', 'lia', 1, 1200, 5200, 'Alô? Tem alguém nessa frequência?', 'Contenha o medo.'),
    db.prepare('INSERT OR IGNORE INTO script_lines (id, scene_id, role_id, sequence, start_ms, end_ms, text, direction) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind('line-2', 'challenge-001', 'lia', 2, 7800, 12100, 'Eu achei que nunca ouviria outra voz.', 'Alívio e desconfiança.'),
    db.prepare('INSERT OR IGNORE INTO script_lines (id, scene_id, role_id, sequence, start_ms, end_ms, text, direction) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind('line-3', 'challenge-001', 'lia', 3, 13700, 17600, 'Espera... você sabe onde eu estou?', 'A urgência toma conta.'),
  ]);
}

export async function findOrCreateUser(user: ChatGPTUser) {
  await ensureSocialSchema();
  const existing = await env.DB.prepare(
    'SELECT id, display_name, current_streak, longest_streak, last_completed_date FROM users WHERE auth_user_id = ?',
  ).bind(user.userId).first<UserRow>();
  if (existing) return existing;

  const id = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT INTO users (id, auth_user_id, email, display_name) VALUES (?, ?, ?, ?)',
  ).bind(id, user.userId, user.email, user.displayName).run();
  return { id, display_name: user.displayName, current_streak: 0, longest_streak: 0, last_completed_date: null };
}

export async function getProfile(user: ChatGPTUser) {
  const profile = await findOrCreateUser(user);
  const totals = await env.DB.prepare(
    `SELECT COUNT(*) AS submissions,
      COALESCE(SUM((SELECT COUNT(*) FROM reactions r WHERE r.submission_id = s.id)), 0) AS reactions
     FROM submissions s WHERE s.user_id = ?`,
  ).bind(profile.id).first<{ submissions: number; reactions: number }>();
  const history = await env.DB.prepare(
    `SELECT s.id, s.mode, s.visibility, s.published_at, sc.title
     FROM submissions s JOIN scenes sc ON sc.id = s.scene_id
     WHERE s.user_id = ? ORDER BY s.published_at DESC LIMIT 6`,
  ).bind(profile.id).all<{ id: string; mode: string; visibility: string; published_at: number; title: string }>();
  return { profile, totals: totals ?? { submissions: 0, reactions: 0 }, history: history.results };
}

export function todayInSaoPaulo() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

export function previousDate(date: string) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

type UserRow = {
  id: string;
  display_name: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
};
