import type { PostgrestError } from '@supabase/supabase-js';
import type { ChatGPTUser } from '../app/chatgpt-auth';
import type { GameRoomState } from '../lib/game-types';
import { dubScenes } from '../lib/scenes';
import { getAudioBucket, getSupabaseAdmin } from './supabase';

type GamePlayer = { id: string; displayName: string };

type RawRoomState = {
  room: {
    code: string;
    mode: string;
    status: GameRoomState['room']['status'];
    current_round: number;
    total_rounds: number;
    max_players: number;
  };
  me: { id: string; display_name: string; is_host: boolean; seat: number };
  players: Array<{ id: string; display_name: string; seat: number; submitted: boolean }>;
  round: { id: string; round_number: number; scene_slug: string; status: string } | null;
  submissions: Array<{ id: string; user_id: string; display_name: string; seat: number }>;
};

export async function findOrCreateGameUser(user: ChatGPTUser): Promise<GamePlayer> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc('vortex_upsert_user', {
    p_auth_user_id: user.userId,
    p_email: user.email,
    p_display_name: user.displayName,
  });
  if (error) throwGameError(error, 'user_sync_failed');
  const row = data as { id?: string; display_name?: string } | null;
  if (!row?.id) throw new GameError('user_sync_failed', 502);
  return { id: row.id, displayName: row.display_name || user.displayName };
}

export async function createRoom(user: ChatGPTUser) {
  const player = await findOrCreateGameUser(user);
  const supabase = getSupabaseAdmin();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = createRoomCode();
    const { error } = await supabase.rpc('vortex_create_room', { p_user_id: player.id, p_code: code });
    if (!error) return code;
    if (hasErrorCode(error, 'room_code_unavailable')) continue;
    throwGameError(error, 'room_create_failed');
  }
  throw new GameError('room_code_unavailable', 503);
}

export async function joinRoom(code: string, user: ChatGPTUser) {
  const player = await findOrCreateGameUser(user);
  const { error } = await getSupabaseAdmin().rpc('vortex_join_room', {
    p_code: code.toUpperCase(),
    p_user_id: player.id,
  });
  if (error) throwGameError(error, 'room_join_failed');
}

export async function startClassicGame(code: string, user: ChatGPTUser) {
  const player = await findOrCreateGameUser(user);
  const { error } = await getSupabaseAdmin().rpc('vortex_start_game', {
    p_code: code.toUpperCase(),
    p_user_id: player.id,
    p_scene_slugs: randomSceneSlugs(5),
  });
  if (error) throwGameError(error, 'game_start_failed');
}

export async function advanceRound(code: string, user: ChatGPTUser) {
  const player = await findOrCreateGameUser(user);
  const { error } = await getSupabaseAdmin().rpc('vortex_advance_round', {
    p_code: code.toUpperCase(),
    p_user_id: player.id,
  });
  if (error) throwGameError(error, 'round_advance_failed');
}

export async function getRoomState(code: string, user: ChatGPTUser): Promise<GameRoomState> {
  const player = await findOrCreateGameUser(user);
  const { data, error } = await getSupabaseAdmin().rpc('vortex_get_room_state', {
    p_code: code.toUpperCase(),
    p_user_id: player.id,
  });
  if (error) throwGameError(error, 'room_state_failed');
  const raw = data as RawRoomState | null;
  if (!raw?.room || !raw.me) throw new GameError('room_state_failed', 502);

  const sourceScene = raw.round ? dubScenes.find((item) => item.slug === raw.round?.scene_slug) ?? null : null;
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
    room: {
      code: raw.room.code,
      mode: raw.room.mode,
      status: raw.room.status,
      currentRound: raw.room.current_round,
      totalRounds: raw.room.total_rounds,
      maxPlayers: raw.room.max_players,
    },
    me: {
      id: raw.me.id,
      displayName: raw.me.display_name,
      isHost: raw.me.is_host,
      seat: raw.me.seat,
    },
    players: raw.players.map((item) => ({
      id: item.id,
      displayName: item.display_name,
      seat: item.seat,
      submitted: item.submitted,
    })),
    round: raw.round && scene ? {
      id: raw.round.id,
      number: raw.round.round_number,
      status: raw.round.status,
      scene,
    } : null,
    submissions: raw.submissions.map((item) => ({
      id: item.id,
      userId: item.user_id,
      displayName: item.display_name,
      seat: item.seat,
      audioUrl: `/api/rooms/${raw.room.code}/audio/${item.id}`,
    })),
  };
}

export async function submitRoundAudio(code: string, user: ChatGPTUser, file: File, durationMs: number) {
  const player = await findOrCreateGameUser(user);
  const state = await getRoomStateForPlayer(code, player.id);
  if (state.room.status !== 'playing' || !state.round) throw new GameError('round_not_recording', 409);
  if (state.players.find((item) => item.id === player.id)?.submitted) throw new GameError('already_submitted', 409);

  const submissionId = crypto.randomUUID();
  const contentType = normalizeAudioContentType(file.type);
  const extension = audioExtension(contentType);
  const objectKey = `games/${state.room.code}/${state.round.id}/${player.id}/${submissionId}.${extension}`;
  const supabase = getSupabaseAdmin();
  const bucket = getAudioBucket();
  const { error: uploadError } = await supabase.storage.from(bucket).upload(objectKey, await file.arrayBuffer(), {
    cacheControl: '3600',
    contentType,
    upsert: false,
  });
  if (uploadError) throw new GameError('audio_upload_failed', 502);

  const { error } = await supabase.rpc('vortex_submit_round', {
    p_code: code.toUpperCase(),
    p_user_id: player.id,
    p_submission_id: submissionId,
    p_audio_object_key: objectKey,
    p_content_type: contentType,
    p_size_bytes: file.size,
    p_duration_ms: durationMs,
  });
  if (error) {
    await supabase.storage.from(bucket).remove([objectKey]);
    throwGameError(error, 'audio_metadata_failed');
  }
}

export async function getSubmissionAudio(code: string, submissionId: string, user: ChatGPTUser) {
  const player = await findOrCreateGameUser(user);
  const supabase = getSupabaseAdmin();
  const { data: metadata, error: metadataError } = await supabase.rpc('vortex_get_submission_audio', {
    p_code: code.toUpperCase(),
    p_submission_id: submissionId,
    p_user_id: player.id,
  });
  if (metadataError) throwGameError(metadataError, 'audio_not_found');
  const row = metadata as { audio_object_key?: string; content_type?: string; size_bytes?: number } | null;
  if (!row?.audio_object_key || !row.content_type) throw new GameError('audio_not_found', 404);

  const { data: blob, error } = await supabase.storage.from(getAudioBucket()).download(row.audio_object_key);
  if (error || !blob) throw new GameError('audio_not_found', 404);
  return { blob, contentType: row.content_type, size: row.size_bytes ?? blob.size };
}

async function getRoomStateForPlayer(code: string, playerId: string) {
  const { data, error } = await getSupabaseAdmin().rpc('vortex_get_room_state', {
    p_code: code.toUpperCase(),
    p_user_id: playerId,
  });
  if (error) throwGameError(error, 'room_state_failed');
  const raw = data as RawRoomState | null;
  if (!raw?.room) throw new GameError('room_state_failed', 502);
  return raw;
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

function audioExtension(contentType: string) {
  if (contentType === 'audio/ogg') return 'ogg';
  if (contentType === 'audio/mp4') return 'm4a';
  if (contentType === 'audio/mpeg') return 'mp3';
  return 'webm';
}

function normalizeAudioContentType(contentType: string) {
  const normalized = contentType.toLowerCase().split(';', 1)[0].trim();
  return ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg'].includes(normalized) ? normalized : 'audio/webm';
}

function hasErrorCode(error: Pick<PostgrestError, 'message' | 'details'>, code: string) {
  return error.message.includes(code) || error.details?.includes(code);
}

function throwGameError(error: PostgrestError, fallback: string): never {
  const known = [
    'room_not_found', 'room_full', 'game_already_started', 'not_in_room', 'host_only',
    'round_not_ready', 'round_not_recording', 'already_submitted', 'audio_not_found',
    'room_code_unavailable', 'invalid_room_code', 'invalid_scene_set', 'user_not_found',
  ].find((code) => hasErrorCode(error, code));
  const code = known ?? fallback;
  const status = code.endsWith('_not_found') ? 404
    : ['not_in_room', 'host_only'].includes(code) ? 403
      : ['room_full', 'game_already_started', 'round_not_ready', 'round_not_recording', 'already_submitted'].includes(code) ? 409
        : 502;
  throw new GameError(code, status);
}

export class GameError extends Error {
  constructor(public code: string, public status: number) {
    super(code);
    this.name = 'GameError';
  }
}
