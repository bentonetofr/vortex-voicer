import { getChatGPTUser } from '../../chatgpt-auth';
import { createRoom } from '../../../db/game';
import { gameApiError } from '../../../lib/game-api';

export async function POST() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ message: 'Entre para criar uma sala.' }, { status: 401 });
  try {
    return Response.json({ code: await createRoom(user) }, { status: 201 });
  } catch (error) {
    return gameApiError(error);
  }
}
