import type { Metadata } from 'next';
import { CommunityFeed } from '../components/community-feed';
import { DailyCountdown } from '../components/daily-countdown';
import { SiteHeader } from '../components/site-header';
import { dailyChallenge } from '../../lib/daily-challenge';

export const metadata: Metadata = {
  title: 'Comunidade | Vortex Voice',
  description: 'Descubra interpretações, improvisos e as vozes que deram vida ao desafio diário.',
};

export default function CommunityPage() {
  return (
    <main className="community-page">
      <SiteHeader active="community" />
      <div className="community-shell">
        <section className="community-hero">
          <div><p className="content-label">A MESMA CENA, MIL POSSIBILIDADES</p><h1>Vozes da comunidade.</h1><p>O desafio só termina depois que você descobre como outras pessoas entraram na cena.</p></div>
          <div className="community-daily-card"><span><i /> DESAFIO ABERTO</span><strong>{dailyChallenge.title}</strong><DailyCountdown showLabel /><a href="/desafio">Fazer minha versão →</a></div>
        </section>
        <CommunityFeed />
      </div>
    </main>
  );
}
