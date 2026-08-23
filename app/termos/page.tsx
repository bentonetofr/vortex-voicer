import type { Metadata } from 'next';
import { SiteHeader } from '../components/site-header';

export const metadata: Metadata = {
  title: 'Termos de uso | Vortex Voice',
  description: 'Regras para participar dos desafios e compartilhar dublagens no Vortex Voice.',
};

export default function TermsPage() {
  return (
    <main className="legal-page" id="main-content">
      <SiteHeader />
      <article className="legal-shell">
        <p className="content-label">ÚLTIMA ATUALIZAÇÃO: 23 DE AGOSTO DE 2026</p>
        <h1>Termos de uso</h1>
        <p className="legal-lead">Estes termos explicam as regras básicas para usar o protótipo Vortex Voice.</p>

        <section><h2>1. Participação</h2><p>Você deve ter idade compatível com a classificação indicada em cada desafio. Ao gravar, confirme que tem autorização para usar a voz enviada e não se passe por outra pessoa.</p></section>
        <section><h2>2. Suas dublagens</h2><p>Você continua responsável pelo áudio, legenda e demais materiais que publicar. Ao escolher uma versão pública, autoriza o Vortex Voice a exibi-la na comunidade enquanto ela permanecer publicada.</p></section>
        <section><h2>3. Conteúdo das cenas</h2><p>Este protótipo usa apenas uma cena demonstrativa criada para o projeto. Uma versão comercial deverá licenciar previamente trechos de filmes, séries, desenhos e vídeos de terceiros com seus titulares.</p></section>
        <section><h2>4. Uso responsável</h2><p>Não publique conteúdo ilegal, ofensivo, discriminatório, enganoso ou que viole privacidade e direitos autorais. Conteúdos incompatíveis com essas regras poderão ser removidos.</p></section>
        <section><h2>5. Protótipo</h2><p>O serviço está em desenvolvimento e pode mudar, ficar indisponível ou perder dados de teste. Não use esta versão para armazenar gravações que sejam sua única cópia.</p></section>
      </article>
    </main>
  );
}
