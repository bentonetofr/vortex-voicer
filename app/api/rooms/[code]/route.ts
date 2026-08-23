import { getChatGPTUser } from '../../../chatgpt-auth';
import { advanceRound, getRoomState, joinRoom, startClassicGame } from '../../../../db/game';
import { gameApiError } from '../../../../lib/game-api';

type Context = { params: Promise<{ code: string }> };

function validCode(code: string) {
  const normalized = code.toUpperCase();
  return /^[A-Z2-9]{6}$/.test(normalized) ? normalized : null;
}

export async function GET(_request: Request, context: Context) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ message: 'Entre para abrir a sala.' }, { status: 401 });
  const code = validCode((await context.params).code);
  if (!code) return Response.json({ message: 'Código inválido.' }, { status: 400 });
  try {
    return Response.json(await getRoomState(code, user));
  } catch (error) {
    return gameApiError(error);
  }
}

export async function POST(request: Request, context: Context) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ message: 'Entre para jogar.' }, { status: 401 });
  const code = validCode((await context.params).code);
  if (!code) return Response.json({ message: 'Código inválido.' }, { status: 400 });
  const body = await request.json().catch(() => null) as { action?: string } | null;
  try {
    if (body?.action === 'join') await joinRoom(code, user);
    else if (body?.action === 'start') await startClassicGame(code, user);
    else if (body?.action === 'advance') await advanceRound(code, user);
    else return Response.json({ message: 'Ação inválida.' }, { status: 400 });
    return Response.json(await getRoomState(code, user));
  } catch (error) {
    return gameApiError(error);
  }
}
