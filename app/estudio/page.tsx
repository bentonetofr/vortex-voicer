import type { Metadata } from 'next';
import { RecordingStudio } from '../components/recording-studio';
import { SiteHeader } from '../components/site-header';
import { getDailyChallenge } from '../../lib/daily-challenge';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const dailyChallenge = getDailyChallenge();
  return {
    title: `Estúdio — ${dailyChallenge.title} | Vortex Voice`,
    description: 'Grave suas falas, refaça tomadas e revise a dublagem completa no estúdio Vortex Voice.',
    robots: { index: false, follow: false },
  };
}

export default function StudioPage() {
  const dailyChallenge = getDailyChallenge();
  return (
    <main className="studio-page" id="main-content">
      <SiteHeader />
      <div className="studio-shell">
        <div className="studio-breadcrumb">
          <a href="/desafio">← Voltar ao desafio</a>
          <span>Desafio #{dailyChallenge.number}</span>
        </div>
        <RecordingStudio challenge={dailyChallenge} />
      </div>
    </main>
  );
}
