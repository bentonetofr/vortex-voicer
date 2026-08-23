type SiteHeaderProps = {
  active?: 'today' | 'community' | 'how';
};

export function SiteHeader({ active = 'today' }: SiteHeaderProps) {
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
        <a className={active === 'today' ? 'active' : ''} href="/desafio">Hoje</a>
        <a className={active === 'community' ? 'active' : ''} href="/comunidade">Comunidade</a>
        <a className={active === 'how' ? 'active' : ''} href="/#como-funciona">Como funciona</a>
      </nav>

      <a className="streak-button" href="/perfil" aria-label="Abrir meu perfil e sequência diária">
        <span className="streak-flame" aria-hidden="true">◆</span>
        <strong>Meu</strong><span>perfil</span>
      </a>
    </header>
  );
}
