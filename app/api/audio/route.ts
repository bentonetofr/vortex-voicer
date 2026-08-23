import { env } from 'cloudflare:workers';
import { ensureSocialSchema } from '../../../db/social';

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return new Response('Not found', { status: 404 });
  await ensureSocialSchema();
  const row = await env.DB.prepare(
    `SELECT a.object_key, a.content_type FROM submission_audio a
     JOIN submissions s ON s.id = a.submission_id
     WHERE a.id = ? AND s.visibility = 'public' AND s.status = 'published'`,
  ).bind(id).first<{ object_key: string; content_type: string }>();
  if (!row) return new Response('Not found', { status: 404 });
  const object = await env.FILES.get(row.object_key);
  if (!object) return new Response('Not found', { status: 404 });
  return new Response(object.body, {
    headers: {
      'content-type': row.content_type,
      'cache-control': 'public, max-age=300',
      'content-length': String(object.size),
    },
  });
}
