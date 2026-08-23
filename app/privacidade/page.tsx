import type { Metadata } from 'next';
import { SiteHeader } from '../components/site-header';

export const metadata: Metadata = {
  title: 'Privacidade | Vortex Voice',
  description: 'Entenda como o Vortex Voice trata o microfone e as gravações locais.',
};

export default function PrivacyPage() {
  return (
    <main className="legal-page" id="main-content">
      <SiteHeader />
      <article className="legal-shell">
        <p className="content-label">ÚLTIMA ATUALIZAÇÃO: 23 DE AGOSTO DE 2026</p>
        <h1>Privacidade</h1>
        <p className="legal-lead">A voz é um dado pessoal. Por isso, o Vortex Voice procura deixar claro quando ela fica no aparelho e quando é enviada.</p>

        <section><h2>Sem conta</h2><p>O Vortex Voice não exige cadastro nem login. As gravações feitas no estúdio permanecem no navegador até você baixar os arquivos ou sair da página.</p></section>
        <section><h2>Microfone e gravações</h2><p>O acesso ao microfone só acontece depois da sua permissão. O áudio é processado localmente para a prévia e o download; ele não é enviado para um perfil ou feed público.</p></section>
        <section><h2>Retenção</h2><p>Como não há conta nem publicação interna, o protótipo não mantém um histórico pessoal de dublagens. Você controla os arquivos baixados no seu próprio dispositivo.</p></section>
        <section><h2>Seus cuidados</h2><p>Evite gravar informações sensíveis ou falas de terceiros sem consentimento. Você pode negar o microfone e continuar navegando pela biblioteca.</p></section>
      </article>
    </main>
  );
}
