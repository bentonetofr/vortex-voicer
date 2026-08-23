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
        <div><p className="content-label">UMA PARTIDA, CINCO ESTREIAS</p><h2>Todo mundo recebe a mesma cena.</h2></div>
        <div className="rule-flow"><article><span>01</span><h3>Reúna a sala</h3><p>Crie um convite e chame até sete amigos.</p></article><i>→</i><article><span>02</span><h3>Dublem juntos</h3><p>A mesma cena aparece para todos gravarem.</p></article><i>→</i><article><span>03</span><h3>Assistam às versões</h3><p>Cada dublagem entra em cena, uma depois da outra.</p></article></div>
      </section>
    </main>
  );
}

function SignInLanding() {
  return (
    <section className="signin-game-hero">
      <div><p className="game-kicker"><span /> DUBLAGEM MULTIPLAYER</p><h1>A cena é a mesma.<br /><span>As vozes, nem tanto.</span></h1><p>Entre, monte sua sala e transforme cinco cenas aleatórias em uma sessão de dublagem com seus amigos.</p><a className="primary-button" href={chatGPTSignInPath('/')}>Entrar para jogar <span>→</span></a></div>
      <div className="party-preview" aria-hidden="true"><span className="preview-badge">SALA COM 6 JOGADORES</span><div className="preview-screen"><i>▶</i><strong>RODADA 3/5</strong></div><div className="preview-players">{['BN','MA','LU','JV','CA','+1'].map((name) => <span key={name}>{name}</span>)}</div></div>
    </section>
  );
}
