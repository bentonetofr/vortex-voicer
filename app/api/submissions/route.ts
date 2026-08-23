export function GET() {
  return Response.json({ submissions: [], message: 'As gravações agora ficam somente no dispositivo.' });
}

export function POST() {
  return Response.json({ error: 'local_recording_only' }, { status: 410 });
}
