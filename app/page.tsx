import { chatGPTSignInPath, getChatGPTUser } from './chatgpt-auth';
import { ModeLauncher } from './components/mode-launcher';
import { SiteHeader } from './components/site-header';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getChatGPTUser();
  return (
    <main id="main-content" className="game-home">
      <SiteHeader userName={user?.displayName} />
      {user ? <ModeLauncher playerName={user.displayName} /> : <SignInLanding />}
      <section className="game-rules" id="como-jogar">
        <div><p className="content-label">COMO JOGAR</p><h2>Uma partida tem cinco cenas.</h2></div>
        <div className="rule-flow"><article><span>01</span><h3>Crie uma sala</h3><p>Convide até sete amigos.</p></article><i>→</i><article><span>02</span><h3>Grave a cena</h3><p>Todos recebem o mesmo vídeo.</p></article><i>→</i><article><span>03</span><h3>Assista</h3><p>As dublagens são exibidas em sequência.</p></article></div>
      </section>
    </main>
  );
}

function SignInLanding() {
  return (
    <section className="signin-game-hero">
      <div><p className="game-kicker"><span /> VORTEX VOICE</p><h1>Dublagem<br /><span>multiplayer.</span></h1><p>Entre, crie uma sala e duble cinco cenas com seus amigos.</p><a className="primary-button" href={chatGPTSignInPath('/')}>Entrar <span>→</span></a></div>
      <div className="party-preview" aria-hidden="true"><span className="preview-badge">SALA COM 6 JOGADORES</span><div className="preview-screen"><i>▶</i><strong>RODADA 3/5</strong></div><div className="preview-players">{['BN','MA','LU','JV','CA','+1'].map((name) => <span key={name}>{name}</span>)}</div></div>
    </section>
  );
}
