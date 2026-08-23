import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireChatGPTUser } from '../../chatgpt-auth';
import { GameRoom } from '../../components/game-room';
import { SiteHeader } from '../../components/site-header';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sala multiplayer',
  description: 'Sala do modo Clássico do Vortex Voice.',
};

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toUpperCase();
  if (!/^[A-Z2-9]{6}$/.test(code)) notFound();
  const user = await requireChatGPTUser(`/sala/${code}`);
  return (
    <main id="main-content" className="room-page">
      <SiteHeader userName={user.displayName} />
      <GameRoom code={code} />
    </main>
  );
}
