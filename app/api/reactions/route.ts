export function POST() {
  return Response.json({ error: 'community_disabled' }, { status: 410 });
}
