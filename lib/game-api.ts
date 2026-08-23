import { GameError } from '../db/game';

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
};

export function gameApiError(error: unknown) {
  if (error instanceof GameError) {
    return Response.json({ error: error.code, message: messages[error.code] ?? 'Não foi possível concluir.' }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: 'internal_error', message: 'Algo deu errado. Tente novamente.' }, { status: 500 });
}
