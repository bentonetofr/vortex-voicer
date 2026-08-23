import type { Metadata } from 'next';
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from '../chatgpt-auth';
import { SiteHeader } from '../components/site-header';
import { getProfile } from '../../db/social';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Meu perfil | Vortex Voice',
  description: 'Acompanhe sua sequência, estatísticas e histórico de dublagens.',
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const user = await getChatGPTUser();
  if (!user) {
    return (
      <main className="profile-page"><SiteHeader /><section className="signin-card"><span className="profile-lock">●</span><p className="content-label">SEU ESPAÇO</p><h1>Entre para guardar sua sequência.</h1><p>Seu perfil reúne desafios concluídos, reações recebidas e todas as suas dublagens.</p><a className="primary-button" href={chatGPTSignInPath('/perfil')}>Entrar com ChatGPT →</a></section></main>
    );
  }

  const data = await getProfile(user);
  const displayName = user.fullName ?? user.displayName.split('@')[0];
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  const streak = data.profile.current_streak;

  return (
    <main className="profile-page">
      <SiteHeader />
      <div className="profile-shell">
        <section className="profile-header">
          <span className="profile-avatar">{initials || 'VV'}</span>
          <div><p className="content-label">MEU PERFIL</p><h1>{displayName}</h1><p>{user.email}</p></div>
          <a className="profile-signout" href={chatGPTSignOutPath('/')}>Sair</a>
        </section>

        <section className="profile-grid">
          <article className="streak-card">
            <div className="profile-card-heading"><div><p className="content-label">RITMO DIÁRIO</p><h2>Sua sequência</h2></div><span className="big-streak">◆ <strong>{streak}</strong><small>dias</small></span></div>
            <div className="streak-calendar">
              {['S','T','Q','Q','S','S','D','S','T','Q','Q','S','S','D'].map((day, index) => <span className={index >= 14 - Math.min(streak, 14) ? 'done' : ''} key={`${day}-${index}`}><small>{day}</small><i>{index >= 14 - Math.min(streak, 14) ? '✓' : ''}</i></span>)}
            </div>
            <p>{streak ? 'Volte amanhã para manter sua história em movimento.' : 'Complete o desafio de hoje para iniciar sua primeira sequência.'}</p>
          </article>

          <article className="stats-card"><p className="content-label">SEUS NÚMEROS</p><div><span><strong>{data.totals.submissions}</strong><small>dublagens</small></span><span><strong>{data.totals.reactions}</strong><small>reações</small></span><span><strong>{data.profile.longest_streak}</strong><small>melhor sequência</small></span></div></article>
        </section>

        <section className="profile-history">
          <div className="profile-card-heading"><div><p className="content-label">MINHAS CENAS</p><h2>Histórico de dublagens</h2></div><a href="/desafio">Novo desafio →</a></div>
          {data.history.length ? (
            <div className="history-list">{data.history.map((item) => <article key={item.id}><span className="history-thumb"><i /></span><div><strong>{item.title}</strong><small>{item.mode === 'chaos' ? 'Modo caos' : 'Interpretação'} · {item.visibility === 'private' ? 'Privada' : 'Pública'}</small></div><a href="/comunidade">Ver →</a></article>)}</div>
          ) : (
            <div className="empty-history"><span>◎</span><strong>Sua primeira cena começa hoje.</strong><p>Depois de publicar, suas dublagens aparecerão aqui.</p><a className="secondary-button" href="/desafio">Abrir desafio diário</a></div>
          )}
        </section>
      </div>
    </main>
  );
}
