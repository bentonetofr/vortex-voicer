import type { Metadata } from 'next';
import { SiteHeader } from '../components/site-header';

export const metadata: Metadata = {
  title: 'Privacidade | Vortex Voice',
  description: 'Entenda como o Vortex Voice trata conta, gravações e dados de participação.',
};

export default function PrivacyPage() {
  return (
    <main className="legal-page" id="main-content">
      <SiteHeader />
      <article className="legal-shell">
        <p className="content-label">ÚLTIMA ATUALIZAÇÃO: 23 DE AGOSTO DE 2026</p>
        <h1>Privacidade</h1>
        <p className="legal-lead">A voz é um dado pessoal. Por isso, o Vortex Voice procura deixar claro quando ela fica no aparelho e quando é enviada.</p>

        <section><h2>O que é tratado</h2><p>Quando você entra, recebemos as informações básicas da sua conta necessárias para identificar o perfil. Também registramos desafios concluídos, sequência, preferências de publicação e reações.</p></section>
        <section><h2>Microfone e gravações</h2><p>O microfone só é ativado depois da sua ação e da permissão do navegador. Durante a gravação, as tomadas ficam no dispositivo. Elas só são enviadas quando você escolhe concluir e publicar.</p></section>
        <section><h2>Pública ou privada</h2><p>Uma dublagem pública pode aparecer na comunidade. Uma dublagem privada fica associada ao perfil e não entra no feed público. A opção é apresentada antes do envio.</p></section>
        <section><h2>Finalidade e retenção</h2><p>Os dados são usados para operar o desafio, montar o perfil, manter a sequência e exibir as versões autorizadas. Em uma versão comercial, prazos de retenção e um canal de exclusão serão informados antes do lançamento.</p></section>
        <section><h2>Seus cuidados</h2><p>Evite gravar informações sensíveis ou falas de terceiros sem consentimento. Você pode negar o microfone e ainda navegar pelas áreas públicas do protótipo.</p></section>
      </article>
    </main>
  );
}
