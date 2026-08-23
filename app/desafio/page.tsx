import type { Metadata } from 'next';
import { ChallengeSetup } from '../components/challenge-setup';
import { ScenePreview } from '../components/scene-preview';
import { SiteHeader } from '../components/site-header';
import { getScene } from '../../lib/scenes';

export const dynamic = 'force-dynamic';

type ScenePageProps = { searchParams: Promise<{ scene?: string }> };

export async function generateMetadata({ searchParams }: ScenePageProps): Promise<Metadata> {
  const selectedScene = getScene((await searchParams).scene);
  return {
    title: `${selectedScene.title} — Dublar cena | Vortex Voice`,
    description: `${selectedScene.description} Abra a cena e grave sua versão sem login.`,
    openGraph: { title: `${selectedScene.title} — Dublar cena`, description: selectedScene.description, images: [] },
    twitter: { title: `${selectedScene.title} — Dublar cena`, description: selectedScene.description, images: [] },
  };
}

export default async function ChallengePage({ searchParams }: ScenePageProps) {
  const selectedScene = getScene((await searchParams).scene);
  return (
    <main className="challenge-page" id="main-content">
      <SiteHeader />

      <div className="challenge-page-shell">
        <div className="challenge-breadcrumb">
          <a href="/#cenas">Biblioteca</a><span aria-hidden="true">/</span><strong>{selectedScene.title}</strong>
        </div>

        <section className="challenge-stage" aria-labelledby="challenge-title">
          <ScenePreview challenge={selectedScene} />

          <div className="challenge-details">
            <div className="detail-topline">
              <span className="daily-badge"><i /> Disponível para dublar</span>
              <span className="challenge-number">BR DUB PACK</span>
            </div>
            <p className="content-label">{selectedScene.sourceTitle.toUpperCase()}</p>
            <h1 id="challenge-title">{selectedScene.title}</h1>
            <p className="challenge-context">{selectedScene.description}</p>
            <div className="scene-meta scene-meta-large" aria-label="Detalhes da cena">
              <span><i className="clock-icon" />{selectedScene.durationSeconds} segundos</span>
              <span><i className="mask-icon" />{selectedScene.genre}</span>
              <span><i className="person-icon" />Gravação livre</span>
            </div>
            <div className="today-stats"><div><strong>Sem login</strong><span>entre direto no estúdio</span></div><i /><div><strong>Livre</strong><span>improvise à vontade</span></div></div>
            <p className="licensed-note pending"><span aria-hidden="true">!</span> Conteúdo do pack · direitos de uso pendentes de verificação</p>
          </div>
        </section>

        <ChallengeSetup challenge={selectedScene} />
      </div>
    </main>
  );
}
