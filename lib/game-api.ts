import { GameError } from '../db/game';
import { SupabaseConfigError } from '../db/supabase';

const messages: Record<string, string> = {
  room_not_found: 'Sala não encontrada.',
  room_full: 'A sala já está cheia.',
  game_already_started: 'A partida já começou.',
  not_in_room: 'Entre na sala antes de continuar.',
  host_only: 'Somente o anfitrião pode fazer isso.',
  round_not_ready: 'A rodada ainda não terminou.',
  round_not_recording: 'Esta rodada não está recebendo dublagens.',
  already_submitted: 'Você já enviou sua dublagem nesta rodada.',
  audio_not_found: 'Áudio não encontrado.',
  audio_upload_failed: 'Não foi possível salvar o áudio no Supabase.',
  audio_metadata_failed: 'O áudio foi enviado, mas a rodada não pôde ser atualizada.',
  room_create_failed: 'Não foi possível criar a sala no Supabase.',
  room_join_failed: 'Não foi possível entrar na sala.',
  room_state_failed: 'Não foi possível carregar a sala.',
  game_start_failed: 'Não foi possível iniciar a partida.',
  round_advance_failed: 'Não foi possível avançar a rodada.',
  user_sync_failed: 'Não foi possível sincronizar seu jogador.',
};

export function gameApiError(error: unknown) {
  if (error instanceof SupabaseConfigError) {
    return Response.json({ error: 'supabase_not_configured', message: 'O Supabase ainda não foi configurado no servidor.' }, { status: 503 });
  }
  if (error instanceof GameError) {
    return Response.json({ error: error.code, message: messages[error.code] ?? 'Não foi possível concluir.' }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: 'internal_error', message: 'Algo deu errado. Tente novamente.' }, { status: 500 });
}
