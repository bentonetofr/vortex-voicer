import { DailyCountdown } from './components/daily-countdown';
import { SiteHeader } from './components/site-header';
import { dailyChallenge } from '../lib/daily-challenge';

const soundBars = [28, 44, 65, 38, 76, 52, 88, 61, 34, 70, 49, 81, 42, 58, 31];

export default function Home() {
  return (
    <main id="main-content">
      <SiteHeader />

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" />desafio diário de dublagem</div>
          <h1>A cena é a mesma.<br /><span>A voz é toda sua.</span></h1>
          <p className="hero-description">
            Dê vida a uma cena nova todos os dias, mantenha sua sequência
            e descubra até onde a sua voz pode chegar.
          </p>

          <div className="hero-actions">
            <a className="primary-button" href="/desafio">
              <span className="mic-symbol" aria-hidden="true" />
              Dublar cena de hoje
              <span className="arrow" aria-hidden="true">→</span>
            </a>
            <a className="text-button" href="#como-funciona">
              <span className="play-symbol" aria-hidden="true">▶</span>
              Ver como funciona
            </a>
          </div>

          <div className="community-note" id="comunidade">
            <div className="avatar-stack" aria-hidden="true">
              <span>MA</span><span>LU</span><span>JO</span><span>+8</span>
            </div>
            <p><strong>{dailyChallenge.participantCount.toLocaleString('pt-BR')} vozes</strong> já entraram no desafio de hoje</p>
          </div>
        </div>

        <div className="challenge-wrap" id="hoje">
          <div className="ambient-orb ambient-orb-one" />
          <div className="ambient-orb ambient-orb-two" />

          <article className="challenge-card">
            <div className="challenge-visual">
              <div className="scene-glow" />
              <div className="scene-window" />
              <div className="scene-silhouette scene-silhouette-left" />
              <div className="scene-silhouette scene-silhouette-right" />
              <div className="challenge-topline">
                <span className="daily-badge"><i /> Cena de hoje</span>
                <span className="challenge-number">#{dailyChallenge.number}</span>
              </div>
              <div className="caption-preview">“{dailyChallenge.quote}”</div>
            </div>

            <div className="challenge-content">
              <div className="challenge-title-row">
                <div><p className="content-label">DESAFIO DO DIA</p><h2>{dailyChallenge.title}</h2></div>
                <span className="age-rating" aria-label={`Classificação indicativa ${dailyChallenge.ageRating} anos`}>{dailyChallenge.ageRating}</span>
              </div>
              <p className="scene-description">{dailyChallenge.synopsis}</p>
              <div className="scene-meta" aria-label="Detalhes da cena">
                <span><i className="clock-icon" />{dailyChallenge.durationSeconds} segundos</span>
                <span><i className="mask-icon" />{dailyChallenge.genre}</span>
                <span><i className="person-icon" />{dailyChallenge.roles.length} personagem</span>
              </div>
              <div className="waveform" aria-hidden="true">
                {soundBars.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
              </div>
              <div className="challenge-footer">
                <DailyCountdown showLabel />
                <a className="round-play" href="/desafio" aria-label="Abrir desafio de hoje">▶</a>
              </div>
            </div>
          </article>

          <div className="floating-streak">
            <span className="mini-flame">◆</span>
            <div><strong>+1 dia</strong><small>Não quebre a sequência</small></div>
          </div>
        </div>
      </section>

      <section className="how-it-works" aria-label="Resumo de como funciona">
        <p>Uma cena por dia</p><span /><p>Grave do seu jeito</p><span /><p>Compartilhe sua versão</p>
      </section>

      <section className="process-section" id="como-funciona">
        <div className="section-heading">
          <p className="content-label">SIMPLES DE ENTRAR EM CENA</p>
          <h2>Uma pequena estreia, todos os dias.</h2>
          <p>Você não precisa entender de dublagem. Só precisa de alguns minutos e vontade de experimentar.</p>
        </div>
        <div className="process-grid">
          <article><span>01</span><i className="process-icon listen-icon" /><h3>Conheça a cena</h3><p>Assista à referência, escolha o personagem e entenda o momento.</p></article>
          <article><span>02</span><i className="process-icon voice-icon" /><h3>Coloque sua voz</h3><p>Siga o texto ou improvise. A interpretação é inteiramente sua.</p></article>
          <article><span>03</span><i className="process-icon share-icon" /><h3>Mostre sua versão</h3><p>Receba o vídeo pronto e veja como outras pessoas resolveram a mesma cena.</p></article>
        </div>
      </section>

      <section className="daily-callout">
        <div>
          <p className="content-label">AINDA DÁ TEMPO</p>
          <h2>Não deixe a cena de hoje passar.</h2>
          <p>O desafio muda à meia-noite, no horário de Brasília.</p>
        </div>
        <div className="callout-action">
          <DailyCountdown />
          <a className="primary-button" href="/desafio">Começar o desafio <span className="arrow">→</span></a>
        </div>
      </section>
    </main>
  );
}
