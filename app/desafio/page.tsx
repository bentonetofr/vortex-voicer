import type { Metadata } from 'next';
import { ChallengeSetup } from '../components/challenge-setup';
import { DailyCountdown } from '../components/daily-countdown';
import { ScenePreview } from '../components/scene-preview';
import { SiteHeader } from '../components/site-header';
import { getDailyChallenge } from '../../lib/daily-challenge';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const dailyChallenge = getDailyChallenge();
  return {
    title: `${dailyChallenge.title} — Desafio de hoje | Vortex Voice`,
    description: `${dailyChallenge.synopsis} Escolha seu estilo e prepare sua dublagem no Vortex Voice.`,
    openGraph: { title: `${dailyChallenge.title} — Desafio de hoje`, description: dailyChallenge.synopsis, images: [] },
    twitter: { title: `${dailyChallenge.title} — Desafio de hoje`, description: dailyChallenge.synopsis, images: [] },
  };
}

export default function ChallengePage() {
  const dailyChallenge = getDailyChallenge();
  return (
    <main className="challenge-page" id="main-content">
      <SiteHeader />

      <div className="challenge-page-shell">
        <div className="challenge-breadcrumb">
          <a href="/">Início</a><span aria-hidden="true">/</span><strong>Desafio #{dailyChallenge.number}</strong>
          <DailyCountdown showLabel />
        </div>

        <section className="challenge-stage" aria-labelledby="challenge-title">
          <ScenePreview challenge={dailyChallenge} />

          <div className="challenge-details">
            <div className="detail-topline">
              <span className="daily-badge"><i /> Cena de hoje</span>
              <span className="challenge-number">#{dailyChallenge.number}</span>
            </div>
            <p className="content-label">{dailyChallenge.sourceTitle.toUpperCase()}</p>
            <h1 id="challenge-title">{dailyChallenge.title}</h1>
            <p className="challenge-context">{dailyChallenge.context}</p>
            <div className="scene-meta scene-meta-large" aria-label="Detalhes da cena">
              <span><i className="clock-icon" />{dailyChallenge.durationSeconds} segundos</span>
              <span><i className="mask-icon" />{dailyChallenge.genre}</span>
              <span><i className="person-icon" />{dailyChallenge.roles.length} personagem</span>
            </div>
            <div className="today-stats">
              <div><strong>{dailyChallenge.participantCount.toLocaleString('pt-BR')}</strong><span>vozes hoje</span></div>
              <i />
              <div><strong>3</strong><span>falas para gravar</span></div>
              <i />
              <div><strong>≈ 3 min</strong><span>para concluir</span></div>
            </div>
            <p className="licensed-note pending"><span aria-hidden="true">!</span> Pack enviado para teste privado · direitos pendentes de verificação</p>
          </div>
        </section>

        <ChallengeSetup challenge={dailyChallenge} />
      </div>
    </main>
  );
}
