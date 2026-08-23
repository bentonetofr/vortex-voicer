import { SiteHeader } from './components/site-header';
import { SceneLibrary } from './components/scene-library';
import { dubScenes } from '../lib/scenes';

export default function Home() {
  const featured = dubScenes.find((scene) => scene.featured) ?? dubScenes[0];

  return (
    <main id="main-content">
      <SiteHeader />

      <section className="library-hero" id="inicio">
        <div className="library-hero-copy">
          <p className="library-kicker"><span /> BR DUB PACK · CENAS ABERTAS</p>
          <h1>Escolha uma cena.<br /><span>Solte a sua voz.</span></h1>
          <p>Explore o pack completo, encontre a cena que combina com você e comece a dublar sem conta, sequência ou compromisso.</p>
          <div className="library-hero-actions">
            <a className="primary-button" href="#cenas">Explorar cenas <span aria-hidden="true">↓</span></a>
            <span><strong>{dubScenes.length}</strong> cenas para dublar</span>
          </div>
        </div>

        <a className="featured-scene" href={`/desafio?scene=${featured.slug}`} aria-label={`Dublar ${featured.title}`}>
          <img src={featured.posterUrl} alt="" />
          <div className="featured-shade" />
          <div className="featured-label"><span>EM DESTAQUE</span><small>{featured.durationSeconds}s</small></div>
          <div className="featured-copy"><p>{featured.sourceTitle}</p><h2>{featured.title}</h2><span className="featured-play">▶</span></div>
        </a>
      </section>

      <section className="scene-library" id="cenas" aria-labelledby="scene-library-title">
        <div className="library-heading">
          <div><p className="content-label">BIBLIOTECA DE CENAS</p><h2 id="scene-library-title">Qual vai ser a sua próxima voz?</h2></div>
          <p>Todos os vídeos ficam disponíveis. Escolha sem pressa e grave quantas versões quiser.</p>
        </div>

        <SceneLibrary scenes={dubScenes} />
      </section>

      <section className="library-how" id="como-funciona">
        <p className="content-label">SEM LOGIN, SEM PRESSA</p>
        <h2>Você escolhe. Você grava. Você se diverte.</h2>
        <div><article><span>01</span><h3>Escolha uma cena</h3><p>Navegue pelo pack inteiro e abra a que mais combina com o seu humor.</p></article><article><span>02</span><h3>Ative o microfone</h3><p>A gravação acontece no navegador e começa somente quando você permitir.</p></article><article><span>03</span><h3>Faça do seu jeito</h3><p>Siga a cena ou improvise. Você pode refazer quantas vezes quiser.</p></article></div>
      </section>
    </main>
  );
}
