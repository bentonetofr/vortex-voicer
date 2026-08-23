import { getChatGPTUser } from '../../../../chatgpt-auth';
import { submitRoundAudio } from '../../../../../db/game';
import { gameApiError } from '../../../../../lib/game-api';

type Context = { params: Promise<{ code: string }> };
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

export async function POST(request: Request, context: Context) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ message: 'Entre para enviar sua dublagem.' }, { status: 401 });
  const code = (await context.params).code.toUpperCase();
  if (!/^[A-Z2-9]{6}$/.test(code)) return Response.json({ message: 'Código inválido.' }, { status: 400 });
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_AUDIO_BYTES + 100_000) return Response.json({ message: 'O áudio ficou grande demais.' }, { status: 413 });

  try {
    const form = await request.formData();
    const audio = form.get('audio');
    const durationMs = Number(form.get('durationMs'));
    if (!(audio instanceof File) || !audio.type.startsWith('audio/') || audio.size < 1 || audio.size > MAX_AUDIO_BYTES) {
      return Response.json({ message: 'Arquivo de áudio inválido.' }, { status: 400 });
    }
    if (!Number.isFinite(durationMs) || durationMs < 250 || durationMs > 15 * 60 * 1000) {
      return Response.json({ message: 'Duração de áudio inválida.' }, { status: 400 });
    }
    await submitRoundAudio(code, user, audio, Math.round(durationMs));
    return Response.json({ ok: true });
  } catch (error) {
    return gameApiError(error);
  }
}
