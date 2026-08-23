type SiteHeaderProps = {
  active?: 'library' | 'how';
};

export function SiteHeader({ active = 'library' }: SiteHeaderProps) {
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
        <a className={active === 'library' ? 'active' : ''} href="/#cenas">Cenas</a>
        <a className={active === 'how' ? 'active' : ''} href="/#como-funciona">Como funciona</a>
      </nav>

      <a className="streak-button" href="/#cenas" aria-label="Explorar todas as cenas">
        <span className="streak-flame" aria-hidden="true">◎</span>
        <strong>Explorar</strong><span>pack</span>
      </a>

      <nav className="mobile-nav" aria-label="Navegação principal no celular">
        <a className={active === 'library' ? 'active' : ''} href="/#cenas">Cenas</a>
        <a className={active === 'how' ? 'active' : ''} href="/#como-funciona">Como funciona</a>
      </nav>
    </header>
  );
}
