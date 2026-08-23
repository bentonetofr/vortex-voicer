export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <a className="footer-brand" href="/#inicio" aria-label="Vortex Voice — início">
          <img src="/vortex-voice-logo.png" alt="" width={512} height={512} />
          <span>VORTEX <strong>VOICE</strong></span>
        </a>
        <p>Um pack inteiro de cenas. Todas esperando a sua voz.</p>
      </div>
      <nav aria-label="Informações legais">
        <a href="/termos">Termos de uso</a>
        <a href="/privacidade">Privacidade</a>
        <a href="/#cenas">Cenas</a>
      </nav>
      <small>© 2026 Vortex Voice · Protótipo em desenvolvimento</small>
    </footer>
  );
}
