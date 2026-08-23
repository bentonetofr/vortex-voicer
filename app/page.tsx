import Image from 'next/image';

const soundBars = [28, 44, 65, 38, 76, 52, 88, 61, 34, 70, 49, 81, 42, 58, 31];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Vortex Voice — início">
          <Image
            className="brand-logo"
            src="/vortex-voice-logo.png"
            alt=""
            width={512}
            height={512}
            priority
          />
          <span className="brand-name">VORTEX <strong>VOICE</strong></span>
          <span className="beta-tag">beta</span>
        </a>

        <nav className="main-nav" aria-label="Navegação principal">
          <a className="active" href="#hoje">Hoje</a>
          <a href="#comunidade">Comunidade</a>
          <a href="#como-funciona">Como funciona</a>
        </nav>

        <button className="streak-button" type="button" aria-label="Sequência de 12 dias">
          <span className="streak-flame" aria-hidden="true">◆</span>
          <strong>12</strong><span>dias</span>
        </button>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" />desafio diário de dublagem</div>
          <h1>A cena é a mesma.<br /><span>A voz é toda sua.</span></h1>
          <p className="hero-description">
            Dê vida a uma cena nova todos os dias, mantenha sua sequência
            e descubra até onde a sua voz pode chegar.
          </p>

          <div className="hero-actions">
            <a className="primary-button" href="#hoje">
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
            <p><strong>1.284 vozes</strong> já entraram no desafio de hoje</p>
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
                <span className="challenge-number">#001</span>
              </div>
              <div className="caption-preview">“Às vezes, tudo que falta é alguém responder...”</div>
            </div>

            <div className="challenge-content">
              <div className="challenge-title-row">
                <div><p className="content-label">DESAFIO DO DIA</p><h2>O último sinal</h2></div>
                <span className="age-rating" aria-label="Classificação indicativa 12 anos">12</span>
              </div>
              <p className="scene-description">Uma transmissão misteriosa. Uma última chance de ser ouvido.</p>
              <div className="scene-meta" aria-label="Detalhes da cena">
                <span><i className="clock-icon" />18 segundos</span>
                <span><i className="mask-icon" />Drama</span>
                <span><i className="person-icon" />1 personagem</span>
              </div>
              <div className="waveform" aria-hidden="true">
                {soundBars.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
              </div>
              <div className="challenge-footer">
                <div className="countdown"><span>PRÓXIMA CENA EM</span><strong>07:42:18</strong></div>
                <a className="round-play" href="#como-funciona" aria-label="Visualizar cena">▶</a>
              </div>
            </div>
          </article>

          <div className="floating-streak">
            <span className="mini-flame">◆</span>
            <div><strong>+1 dia</strong><small>Não quebre a sequência</small></div>
          </div>
        </div>
      </section>

      <section className="how-it-works" id="como-funciona" aria-label="Como funciona">
        <p>Uma cena por dia</p><span /><p>Grave do seu jeito</p><span /><p>Compartilhe sua versão</p>
      </section>
    </main>
  );
}
