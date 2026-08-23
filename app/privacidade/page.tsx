import type { Metadata } from 'next';
import { SiteHeader } from '../components/site-header';

export const metadata: Metadata = {
  title: 'Privacidade | Vortex Voice',
  description: 'Entenda como o Vortex Voice trata login, salas e gravações.',
};

export default function PrivacyPage() {
  return (
    <main className="legal-page" id="main-content">
      <SiteHeader />
      <article className="legal-shell">
        <p className="content-label">ÚLTIMA ATUALIZAÇÃO: 23 DE AGOSTO DE 2026</p>
        <h1>Privacidade</h1>
        <p className="legal-lead">A voz é um dado pessoal. Por isso, o Vortex Voice procura deixar claro quando ela fica no aparelho e quando é enviada.</p>

        <section><h2>Login e identidade</h2><p>O jogo usa o login da plataforma para reconhecer você dentro das salas. Mantemos o identificador da conta, nome de exibição e e-mail necessários para criar partidas e associar cada voz ao jogador correto.</p></section>
        <section><h2>Microfone e gravações</h2><p>O microfone só é ativado após sua permissão. Você ouve uma prévia local antes de enviar; quando confirma, o áudio é armazenado em um bucket privado no Supabase para que os participantes da mesma sala possam assistir à sequência de dublagens.</p></section>
        <section><h2>Salas e retenção</h2><p>O Supabase guarda códigos de sala, participantes, cenas sorteadas e metadados dos áudios para operar as partidas deste protótipo. Não trate o serviço como arquivo permanente e não envie uma gravação que seja sua única cópia.</p></section>
        <section><h2>Compartilhamento</h2><p>Os áudios de uma rodada ficam disponíveis aos participantes que entraram naquela sala. Evite dados sensíveis e não grave outras pessoas sem consentimento.</p></section>
      </article>
    </main>
  );
}
