import { env } from 'cloudflare:workers';
import type { ChatGPTUser } from '../app/chatgpt-auth';
import type { GameRoomState } from '../lib/game-types';
import { dubScenes } from '../lib/scenes';

let schemaPromise: Promise<void> | null = null;

export function ensureGameSchema() {
  schemaPromise ??= createGameSchema();
  return schemaPromise;
}

async function createGameSchema() {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL, auth_user_id TEXT NOT NULL UNIQUE, email TEXT NOT NULL,
      display_name TEXT NOT NULL, bio TEXT, current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0, last_completed_date TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()))`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS game_rooms (
      id TEXT PRIMARY KEY NOT NULL, code TEXT NOT NULL UNIQUE, host_user_id TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'classic', status TEXT NOT NULL DEFAULT 'lobby',
      current_round INTEGER NOT NULL DEFAULT 0, total_rounds INTEGER NOT NULL DEFAULT 5,
      max_players INTEGER NOT NULL DEFAULT 8, created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch()), FOREIGN KEY (host_user_id) REFERENCES users(id) ON DELETE CASCADE)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS room_players (
      room_id TEXT NOT NULL, user_id TEXT NOT NULL, seat INTEGER NOT NULL,
      joined_at INTEGER NOT NULL DEFAULT (unixepoch()), PRIMARY KEY (room_id, user_id),
      UNIQUE (room_id, seat), FOREIGN KEY (room_id) REFERENCES game_rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS game_rounds (
      id TEXT PRIMARY KEY NOT NULL, room_id TEXT NOT NULL, round_number INTEGER NOT NULL,
      scene_slug TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'queued',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()), UNIQUE (room_id, round_number),
      FOREIGN KEY (room_id) REFERENCES game_rooms(id) ON DELETE CASCADE)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS round_submissions (
      id TEXT PRIMARY KEY NOT NULL, round_id TEXT NOT NULL, user_id TEXT NOT NULL,
      audio_object_key TEXT NOT NULL UNIQUE, content_type TEXT NOT NULL, size_bytes INTEGER NOT NULL,
      duration_ms INTEGER NOT NULL, submitted_at INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE (round_id, user_id), FOREIGN KEY (round_id) REFERENCES game_rounds(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`),
  ]);
  await env.DB.batch([
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_room_players_user ON room_players(user_id)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_game_rounds_room_status ON game_rounds(room_id, status)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_round_submissions_round_time ON round_submissions(round_id, submitted_at)'),
  ]);
  await env.DB.prepare('PRAGMA optimize').run();
}

export async function findOrCreateGameUser(user: ChatGPTUser) {
  await ensureGameSchema();
  const existing = await env.DB.prepare('SELECT id, display_name FROM users WHERE auth_user_id = ?')
    .bind(user.userId).first<{ id: string; display_name: string }>();
  if (existing) {
    if (existing.display_name !== user.displayName) {
      await env.DB.prepare('UPDATE users SET display_name = ?, email = ? WHERE id = ?').bind(user.displayName, user.email, existing.id).run();
    }
    return { id: existing.id, displayName: user.displayName };
  }
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO users (id, auth_user_id, email, display_name) VALUES (?, ?, ?, ?)')
    .bind(id, user.userId, user.email, user.displayName).run();
  return { id, displayName: user.displayName };
}

export async function createRoom(user: ChatGPTUser) {
  const player = await findOrCreateGameUser(user);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const id = crypto.randomUUID();
    const code = createRoomCode();
    const existing = await env.DB.prepare('SELECT id FROM game_rooms WHERE code = ?').bind(code).first();
    if (existing) continue;
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO game_rooms (id, code, host_user_id, mode, status, current_round, total_rounds, max_players)
        VALUES (?, ?, ?, 'classic', 'lobby', 0, 5, 8)`).bind(id, code, player.id),
      env.DB.prepare('INSERT INTO room_players (room_id, user_id, seat) VALUES (?, ?, 1)').bind(id, player.id),
    ]);
    return code;
  }
  throw new Error('room_code_unavailable');
}

export async function joinRoom(code: string, user: ChatGPTUser) {
  const player = await findOrCreateGameUser(user);
  const room = await getRoomRow(code);
  if (!room) throw new GameError('room_not_found', 404);
  const member = await env.DB.prepare('SELECT seat FROM room_players WHERE room_id = ? AND user_id = ?').bind(room.id, player.id).first();
  if (member) return;
  if (room.status !== 'lobby') throw new GameError('game_already_started', 409);
  const count = await env.DB.prepare('SELECT COUNT(*) AS count FROM room_players WHERE room_id = ?').bind(room.id).first<{ count: number }>();
  if ((count?.count ?? 0) >= room.max_players) throw new GameError('room_full', 409);
  const nextSeat = await env.DB.prepare('SELECT COALESCE(MAX(seat), 0) + 1 AS seat FROM room_players WHERE room_id = ?').bind(room.id).first<{ seat: number }>();
  await env.DB.prepare(`INSERT OR IGNORE INTO room_players (room_id, user_id, seat)
    SELECT ?, ?, ? WHERE (SELECT COUNT(*) FROM room_players WHERE room_id = ?) < ?`)
    .bind(room.id, player.id, nextSeat?.seat ?? 1, room.id, room.max_players).run();
}

export async function startClassicGame(code: string, user: ChatGPTUser) {
  const player = await findOrCreateGameUser(user);
  const room = await requireHostRoom(code, player.id);
  if (room.status !== 'lobby') throw new GameError('game_already_started', 409);
  const claim = await env.DB.prepare("UPDATE game_rooms SET status = 'starting', updated_at = unixepoch() WHERE id = ? AND status = 'lobby'").bind(room.id).run();
  if (!claim.meta.changes) throw new GameError('game_already_started', 409);
  try {
    const sceneSlugs = randomSceneSlugs(5);
    await env.DB.batch([
      ...sceneSlugs.map((slug, index) => env.DB.prepare(`INSERT INTO game_rounds
        (id, room_id, round_number, scene_slug, status) VALUES (?, ?, ?, ?, ?)`)
        .bind(crypto.randomUUID(), room.id, index + 1, slug, index === 0 ? 'recording' : 'queued')),
      env.DB.prepare("UPDATE game_rooms SET status = 'playing', current_round = 1, updated_at = unixepoch() WHERE id = ?").bind(room.id),
    ]);
  } catch (error) {
    await env.DB.prepare("UPDATE game_rooms SET status = 'lobby', updated_at = unixepoch() WHERE id = ?").bind(room.id).run();
    throw error;
  }
}

export async function advanceRound(code: string, user: ChatGPTUser) {
  const player = await findOrCreateGameUser(user);
  const room = await requireHostRoom(code, player.id);
  if (room.status !== 'playback') throw new GameError('round_not_ready', 409);
  if (room.current_round >= room.total_rounds) {
    await env.DB.prepare("UPDATE game_rooms SET status = 'finished', updated_at = unixepoch() WHERE id = ?").bind(room.id).run();
    return;
  }
  const nextRound = room.current_round + 1;
  await env.DB.batch([
    env.DB.prepare("UPDATE game_rounds SET status = 'completed' WHERE room_id = ? AND round_number = ?").bind(room.id, room.current_round),
    env.DB.prepare("UPDATE game_rounds SET status = 'recording' WHERE room_id = ? AND round_number = ?").bind(room.id, nextRound),
    env.DB.prepare("UPDATE game_rooms SET status = 'playing', current_round = ?, updated_at = unixepoch() WHERE id = ?").bind(nextRound, room.id),
  ]);
}

export async function getRoomState(code: string, user: ChatGPTUser): Promise<GameRoomState> {
  const player = await findOrCreateGameUser(user);
  const room = await getRoomRow(code);
  if (!room) throw new GameError('room_not_found', 404);
  const membership = await env.DB.prepare('SELECT seat FROM room_players WHERE room_id = ? AND user_id = ?').bind(room.id, player.id).first<{ seat: number }>();
  if (!membership) throw new GameError('not_in_room', 403);
  const players = await env.DB.prepare(`SELECT u.id, u.display_name, rp.seat,
    EXISTS(SELECT 1 FROM round_submissions rs JOIN game_rounds gr ON gr.id = rs.round_id
      WHERE gr.room_id = rp.room_id AND gr.round_number = ? AND rs.user_id = u.id) AS submitted
    FROM room_players rp JOIN users u ON u.id = rp.user_id WHERE rp.room_id = ? ORDER BY rp.seat`)
    .bind(room.current_round, room.id).all<{ id: string; display_name: string; seat: number; submitted: number }>();
  const round = room.current_round > 0
    ? await env.DB.prepare('SELECT id, round_number, scene_slug, status FROM game_rounds WHERE room_id = ? AND round_number = ?')
      .bind(room.id, room.current_round).first<{ id: string; round_number: number; scene_slug: string; status: string }>()
    : null;
  const submissions = round ? await env.DB.prepare(`SELECT rs.id, rs.user_id, u.display_name, rp.seat
    FROM round_submissions rs JOIN users u ON u.id = rs.user_id
    JOIN room_players rp ON rp.user_id = rs.user_id AND rp.room_id = ?
    WHERE rs.round_id = ? ORDER BY rp.seat`).bind(room.id, round.id).all<{ id: string; user_id: string; display_name: string; seat: number }>() : { results: [] };
  const sourceScene = round ? dubScenes.find((item) => item.slug === round.scene_slug) ?? null : null;
  const scene = sourceScene ? {
    slug: sourceScene.slug,
    title: sourceScene.title,
    sourceTitle: sourceScene.sourceTitle,
    description: sourceScene.description,
    durationSeconds: sourceScene.durationSeconds,
    videoUrl: sourceScene.videoUrl,
    posterUrl: sourceScene.posterUrl,
    ageRating: sourceScene.ageRating,
    genre: sourceScene.genre,
  } : null;
  return {
    room: { code: room.code, mode: room.mode, status: room.status, currentRound: room.current_round, totalRounds: room.total_rounds, maxPlayers: room.max_players },
    me: { id: player.id, displayName: player.displayName, isHost: room.host_user_id === player.id, seat: membership.seat },
    players: players.results.map((item) => ({ id: item.id, displayName: item.display_name, seat: item.seat, submitted: Boolean(item.submitted) })),
    round: round && scene ? { id: round.id, number: round.round_number, status: round.status, scene } : null,
    submissions: submissions.results.map((item) => ({ id: item.id, userId: item.user_id, displayName: item.display_name, seat: item.seat, audioUrl: `/api/rooms/${room.code}/audio/${item.id}` })),
  };
}

export async function submitRoundAudio(code: string, user: ChatGPTUser, file: File, durationMs: number) {
  const player = await findOrCreateGameUser(user);
  const room = await getRoomRow(code);
  if (!room) throw new GameError('room_not_found', 404);
  const membership = await env.DB.prepare('SELECT 1 FROM room_players WHERE room_id = ? AND user_id = ?').bind(room.id, player.id).first();
  if (!membership) throw new GameError('not_in_room', 403);
  if (room.status !== 'playing') throw new GameError('round_not_recording', 409);
  const round = await env.DB.prepare("SELECT id FROM game_rounds WHERE room_id = ? AND round_number = ? AND status = 'recording'")
    .bind(room.id, room.current_round).first<{ id: string }>();
  if (!round) throw new GameError('round_not_recording', 409);
  const existing = await env.DB.prepare('SELECT id FROM round_submissions WHERE round_id = ? AND user_id = ?').bind(round.id, player.id).first();
  if (existing) throw new GameError('already_submitted', 409);
  const submissionId = crypto.randomUUID();
  const objectKey = `games/${room.id}/${round.id}/${player.id}/${submissionId}`;
  await env.FILES.put(objectKey, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { roomId: room.id, roundId: round.id, userId: player.id } });
  try {
    await env.DB.prepare(`INSERT INTO round_submissions
      (id, round_id, user_id, audio_object_key, content_type, size_bytes, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(submissionId, round.id, player.id, objectKey, file.type, file.size, durationMs).run();
  } catch (error) {
    await env.FILES.delete(objectKey);
    throw error;
  }
  const counts = await env.DB.prepare(`SELECT
    (SELECT COUNT(*) FROM round_submissions WHERE round_id = ?) AS submissions,
    (SELECT COUNT(*) FROM room_players WHERE room_id = ?) AS players`).bind(round.id, room.id).first<{ submissions: number; players: number }>();
  if (counts && counts.submissions >= counts.players) {
    await env.DB.batch([
      env.DB.prepare("UPDATE game_rounds SET status = 'playback' WHERE id = ? AND status = 'recording'").bind(round.id),
      env.DB.prepare("UPDATE game_rooms SET status = 'playback', updated_at = unixepoch() WHERE id = ? AND status = 'playing'").bind(room.id),
    ]);
  }
}

export async function getSubmissionAudio(code: string, submissionId: string, user: ChatGPTUser) {
  const player = await findOrCreateGameUser(user);
  const row = await env.DB.prepare(`SELECT rs.audio_object_key, rs.content_type, gr.room_id
    FROM round_submissions rs JOIN game_rounds gr ON gr.id = rs.round_id
    JOIN game_rooms room ON room.id = gr.room_id WHERE room.code = ? AND rs.id = ?`)
    .bind(code, submissionId).first<{ audio_object_key: string; content_type: string; room_id: string }>();
  if (!row) throw new GameError('audio_not_found', 404);
  const membership = await env.DB.prepare('SELECT 1 FROM room_players WHERE room_id = ? AND user_id = ?').bind(row.room_id, player.id).first();
  if (!membership) throw new GameError('not_in_room', 403);
  const object = await env.FILES.get(row.audio_object_key);
  if (!object) throw new GameError('audio_not_found', 404);
  return { object, contentType: row.content_type };
}

async function requireHostRoom(code: string, userId: string) {
  const room = await getRoomRow(code);
  if (!room) throw new GameError('room_not_found', 404);
  if (room.host_user_id !== userId) throw new GameError('host_only', 403);
  return room;
}

async function getRoomRow(code: string) {
  await ensureGameSchema();
  return env.DB.prepare(`SELECT id, code, host_user_id, mode, status, current_round, total_rounds, max_players
    FROM game_rooms WHERE code = ?`).bind(code.toUpperCase()).first<RoomRow>();
}

function randomSceneSlugs(count: number) {
  const values = [...dubScenes];
  for (let index = values.length - 1; index > 0; index -= 1) {
    const random = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
    const target = Math.floor(random * (index + 1));
    [values[index], values[target]] = [values[target], values[index]];
  }
  return values.slice(0, count).map((scene) => scene.slug);
}

function createRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

type RoomRow = {
  id: string;
  code: string;
  host_user_id: string;
  mode: string;
  status: GameRoomState['room']['status'];
  current_round: number;
  total_rounds: number;
  max_players: number;
};

export class GameError extends Error {
  constructor(public code: string, public status: number) { super(code); }
}
