import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { ensureSocialSchema, findOrCreateUser } from '../../../db/social';

const allowedTypes = new Set(['funny', 'great', 'voice']);

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'authentication_required' }, { status: 401 });
  const body = await request.json<{ submissionId?: string; type?: string }>();
  if (!body.submissionId || !body.type || !allowedTypes.has(body.type)) {
    return Response.json({ error: 'invalid_reaction' }, { status: 400 });
  }
  await ensureSocialSchema();
  const profile = await findOrCreateUser(user);
  const existing = await env.DB.prepare(
    'SELECT id FROM reactions WHERE user_id = ? AND submission_id = ? AND type = ?',
  ).bind(profile.id, body.submissionId, body.type).first<{ id: string }>();
  if (existing) {
    await env.DB.prepare('DELETE FROM reactions WHERE id = ?').bind(existing.id).run();
    return Response.json({ active: false });
  }
  await env.DB.prepare(
    'INSERT INTO reactions (id, user_id, submission_id, type) VALUES (?, ?, ?, ?)',
  ).bind(crypto.randomUUID(), profile.id, body.submissionId, body.type).run();
  return Response.json({ active: true });
}
