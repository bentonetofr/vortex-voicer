import { getChatGPTUser } from '../../../../../chatgpt-auth';
import { getSubmissionAudio } from '../../../../../../db/game';
import { gameApiError } from '../../../../../../lib/game-api';

type Context = { params: Promise<{ code: string; submissionId: string }> };

export async function GET(_request: Request, context: Context) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ message: 'Entre para ouvir.' }, { status: 401 });
  const { code, submissionId } = await context.params;
  try {
    const { object, contentType } = await getSubmissionAudio(code.toUpperCase(), submissionId, user);
    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(object.size),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    return gameApiError(error);
  }
}
