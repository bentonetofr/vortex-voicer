import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { ensureSocialSchema, findOrCreateUser, previousDate, todayInSaoPaulo } from '../../../db/social';
import { dailyChallenge } from '../../../lib/daily-challenge';

export async function GET() {
  await ensureSocialSchema();
  const rows = await env.DB.prepare(
    `SELECT s.id, s.mode, s.caption, s.published_at, u.display_name,
      (SELECT COUNT(*) FROM reactions r WHERE r.submission_id = s.id) AS reaction_count,
      (SELECT id FROM submission_audio a WHERE a.submission_id = s.id ORDER BY rowid LIMIT 1) AS audio_id
     FROM submissions s JOIN users u ON u.id = s.user_id
     WHERE s.visibility = 'public' AND s.status = 'published'
     ORDER BY s.published_at DESC LIMIT 20`,
  ).all<CommunityRow>();
  return Response.json({ submissions: rows.results });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'authentication_required' }, { status: 401 });
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 20 * 1024 * 1024) return Response.json({ error: 'payload_too_large' }, { status: 413 });

  const form = await request.formData();
  const mode = form.get('mode') === 'chaos' ? 'chaos' : 'performance';
  const visibility = form.get('visibility') === 'private' ? 'private' : 'public';
  const caption = String(form.get('caption') ?? '').trim().slice(0, 180);
  const files = dailyChallenge.script.map((line) => ({ line, file: form.get(`audio_${line.id}`) }));
  if (files.some(({ file }) => !(file instanceof File) || file.size === 0 || file.size > 6 * 1024 * 1024 || !file.type.startsWith('audio/'))) {
    return Response.json({ error: 'invalid_audio' }, { status: 400 });
  }

  await ensureSocialSchema();
  const profile = await findOrCreateUser(user);
  const submissionId = crypto.randomUUID();
  const uploadedKeys: string[] = [];

  try {
    const audioRows = [];
    for (const item of files) {
      const file = item.file as File;
      const objectKey = `submissions/${profile.id}/${submissionId}/${item.line.id}`;
      await env.FILES.put(objectKey, file.stream(), {
        httpMetadata: { contentType: file.type },
        customMetadata: { ownerId: profile.id, submissionId, lineId: item.line.id },
      });
      uploadedKeys.push(objectKey);
      audioRows.push({
        id: crypto.randomUUID(), objectKey, file,
        durationMs: item.line.endMs - item.line.startMs, lineId: item.line.id,
      });
    }

    const date = todayInSaoPaulo();
    const existingCompletion = await env.DB.prepare(
      'SELECT id FROM daily_completions WHERE user_id = ? AND completion_date = ?',
    ).bind(profile.id, date).first();
    const nextStreak = existingCompletion
      ? profile.current_streak
      : profile.last_completed_date === previousDate(date) ? profile.current_streak + 1 : 1;
    const longestStreak = Math.max(profile.longest_streak, nextStreak);

    const statements = [
      env.DB.prepare(`INSERT INTO submissions
        (id, user_id, scene_id, role_id, mode, visibility, caption, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`)
        .bind(submissionId, profile.id, dailyChallenge.id, dailyChallenge.roles[0].id, mode, visibility, caption || null),
      ...audioRows.map((audio) => env.DB.prepare(`INSERT INTO submission_audio
        (id, submission_id, script_line_id, object_key, content_type, size_bytes, duration_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(audio.id, submissionId, audio.lineId, audio.objectKey, audio.file.type, audio.file.size, audio.durationMs)),
      env.DB.prepare(`INSERT OR IGNORE INTO daily_completions
        (id, user_id, scene_id, submission_id, completion_date) VALUES (?, ?, ?, ?, ?)`)
        .bind(crypto.randomUUID(), profile.id, dailyChallenge.id, submissionId, date),
    ];
    if (!existingCompletion) {
      statements.push(env.DB.prepare(
        'UPDATE users SET current_streak = ?, longest_streak = ?, last_completed_date = ? WHERE id = ?',
      ).bind(nextStreak, longestStreak, date, profile.id));
    }
    await env.DB.batch(statements);
    return Response.json({ submissionId, streak: nextStreak, visibility });
  } catch (error) {
    await Promise.all(uploadedKeys.map((key) => env.FILES.delete(key)));
    console.error('Failed to publish submission', error);
    return Response.json({ error: 'publish_failed' }, { status: 500 });
  }
}

type CommunityRow = {
  id: string;
  mode: string;
  caption: string | null;
  published_at: number;
  display_name: string;
  reaction_count: number;
  audio_id: string | null;
};
