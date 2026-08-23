type SiteHeaderProps = {
  active?: 'modes' | 'how';
  userName?: string;
};

export function SiteHeader({ active = 'modes', userName }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <a className="brand" href="/#inicio" aria-label="Vortex Voice — início">
        <img
          className="brand-logo"
          src="/vortex-voice-logo.png"
          alt=""
          width={512}
          height={512}
        />
        <span className="brand-name">VORTEX <strong>VOICE</strong></span>
        <span className="beta-tag">beta</span>
      </a>

      <nav className="main-nav" aria-label="Navegação principal">
        <a className={active === 'modes' ? 'active' : ''} href="/#modos">Modos</a>
        <a className={active === 'how' ? 'active' : ''} href="/#como-jogar">Como jogar</a>
      </nav>

      {userName ? <a className="player-chip" href="/signout-with-chatgpt?return_to=%2F"><span>{initials(userName)}</span><strong>{userName}</strong><small>Sair</small></a> : <a className="header-login" href="/signin-with-chatgpt?return_to=%2F">Entrar</a>}

      <nav className="mobile-nav" aria-label="Navegação principal no celular">
        <a className={active === 'modes' ? 'active' : ''} href="/#modos">Modos</a>
        <a className={active === 'how' ? 'active' : ''} href="/#como-jogar">Como jogar</a>
      </nav>
    </header>
  );
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'VV';
}
