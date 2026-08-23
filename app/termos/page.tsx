import type { Metadata } from 'next';
import { SiteHeader } from '../components/site-header';

export const metadata: Metadata = {
  title: 'Termos de uso | Vortex Voice',
  description: 'Regras para explorar cenas e gravar dublagens no Vortex Voice.',
};

export default function TermsPage() {
  return (
    <main className="legal-page" id="main-content">
      <SiteHeader />
      <article className="legal-shell">
        <p className="content-label">ÚLTIMA ATUALIZAÇÃO: 23 DE AGOSTO DE 2026</p>
        <h1>Termos de uso</h1>
        <p className="legal-lead">Estes termos explicam as regras básicas para usar o protótipo Vortex Voice.</p>

        <section><h2>1. Acesso e salas</h2><p>É necessário entrar com uma conta para criar ou participar de uma sala. O modo Clássico comporta até oito jogadores e o link de convite deve ser compartilhado apenas com pessoas que você deseja incluir na partida.</p></section>
        <section><h2>2. Suas dublagens</h2><p>Você continua responsável pelos áudios que criar e enviar. Ao confirmar uma tomada, permite que o Vortex Voice a reproduza sincronizada à cena para todos os participantes da sala.</p></section>
        <section><h2>3. Conteúdo das cenas</h2><p>O protótipo pode receber packs enviados pelo responsável do projeto. A inclusão técnica não comprova autorização de uso: cenas de filmes, séries, desenhos, músicas e vídeos de terceiros devem ser licenciadas com seus titulares antes de qualquer abertura ao público.</p></section>
        <section><h2>4. Uso responsável</h2><p>Não use as cenas ou gravações para conteúdo ilegal, ofensivo, discriminatório, enganoso ou que viole privacidade e direitos autorais.</p></section>
        <section><h2>5. Protótipo</h2><p>O serviço está em desenvolvimento e pode mudar, ficar indisponível ou perder dados de teste. Não use esta versão para armazenar gravações que sejam sua única cópia.</p></section>
      </article>
    </main>
  );
}
