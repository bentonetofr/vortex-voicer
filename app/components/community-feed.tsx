'use client';

import { useEffect, useRef, useState } from 'react';
import { demoSubmissions, type CommunitySubmission } from '../../lib/community-data';

type Filter = 'all' | 'performance' | 'chaos';

export function CommunityFeed() {
  const [items, setItems] = useState<CommunitySubmission[]>(demoSubmissions);
  const [filter, setFilter] = useState<Filter>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeReactions, setActiveReactions] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const demoTimerRef = useRef<number | null>(null);

  useEffect(() => {
    fetch('/api/submissions')
      .then(async (response) => response.ok
        ? await response.json() as { submissions: ApiSubmission[] }
        : { submissions: [] as ApiSubmission[] })
      .then((data) => {
        const realItems = data.submissions.map((item, index): CommunitySubmission => ({
          id: item.id,
          name: item.display_name,
          initials: initialsFor(item.display_name),
          mode: item.mode === 'chaos' ? 'chaos' : 'performance',
          caption: item.caption || 'Minha versão do desafio de hoje.',
          reactions: Number(item.reaction_count ?? 0),
          time: 'agora mesmo',
          color: ['violet', 'blue', 'rose', 'mint'][index % 4],
          audioUrl: item.audio_id ? `/api/audio?id=${encodeURIComponent(item.audio_id)}` : undefined,
        }));
        if (realItems.length) setItems([...realItems, ...demoSubmissions]);
      })
      .catch(() => undefined);
    return () => {
      audioRef.current?.pause();
      if (demoTimerRef.current) window.clearTimeout(demoTimerRef.current);
    };
  }, []);

  const visibleItems = items.filter((item) => filter === 'all' || item.mode === filter);

  const togglePlay = (item: CommunitySubmission) => {
    audioRef.current?.pause();
    if (demoTimerRef.current) window.clearTimeout(demoTimerRef.current);
    if (playingId === item.id) {
      setPlayingId(null);
      return;
    }
    setPlayingId(item.id);
    if (item.audioUrl) {
      const audio = new Audio(item.audioUrl);
      audioRef.current = audio;
      audio.onended = () => setPlayingId(null);
      void audio.play().catch(() => setPlayingId(null));
    } else {
      demoTimerRef.current = window.setTimeout(() => setPlayingId(null), 4500);
    }
  };

  const react = async (item: CommunitySubmission, type: string) => {
    const current = activeReactions[item.id];
    const next = current === type ? '' : type;
    setActiveReactions((state) => ({ ...state, [item.id]: next }));
    setItems((state) => state.map((entry) => entry.id === item.id
      ? { ...entry, reactions: Math.max(0, entry.reactions + (next ? 1 : 0) - (current ? 1 : 0)) }
      : entry));
    if (!item.isDemo) {
      await fetch('/api/reactions', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ submissionId: item.id, type }),
      }).catch(() => undefined);
    }
  };

  return (
    <section className="community-feed" aria-label="Dublagens da comunidade">
      <div className="feed-toolbar">
        <div className="feed-filters" role="group" aria-label="Filtrar dublagens">
          <button className={filter === 'all' ? 'active' : ''} type="button" onClick={() => setFilter('all')}>Todas</button>
          <button className={filter === 'performance' ? 'active' : ''} type="button" onClick={() => setFilter('performance')}>Interpretação</button>
          <button className={filter === 'chaos' ? 'active' : ''} type="button" onClick={() => setFilter('chaos')}>Modo caos</button>
        </div>
        <span>{visibleItems.length} versões em destaque</span>
      </div>

      <div className="voice-grid">
        {visibleItems.map((item, index) => (
          <article className="voice-card" key={item.id}>
            <div className={`voice-scene tone-${item.color} ${playingId === item.id ? 'playing' : ''}`}>
              <div className="mini-scene-window" /><div className="mini-person" />
              <span className="voice-mode">{item.mode === 'chaos' ? 'MODO CAOS' : 'INTERPRETAÇÃO'}</span>
              <button type="button" className="voice-play" onClick={() => togglePlay(item)} aria-label={`${playingId === item.id ? 'Pausar' : 'Ouvir'} dublagem de ${item.name}`}>
                {playingId === item.id ? 'Ⅱ' : '▶'}
              </button>
              <div className="voice-progress"><i /></div>
              {index === 0 && <span className="featured-badge">DESTAQUE DO DIA</span>}
            </div>
            <div className="voice-card-content">
              <div className="voice-author"><span className={`author-avatar tone-${item.color}`}>{item.initials}</span><div><strong>{item.name}</strong><small>{item.time}</small></div><button type="button" aria-label="Mais opções">•••</button></div>
              <p>{item.caption}</p>
              <div className="reaction-row">
                <button className={activeReactions[item.id] === 'funny' ? 'active' : ''} type="button" onClick={() => react(item, 'funny')}>☺ <span>Engraçado</span></button>
                <button className={activeReactions[item.id] === 'great' ? 'active' : ''} type="button" onClick={() => react(item, 'great')}>★ <span>Mandou bem</span></button>
                <strong>{item.reactions}</strong>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function initialsFor(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'VV';
}

type ApiSubmission = {
  id: string; mode: string; caption: string | null; published_at: number;
  display_name: string; reaction_count: number; audio_id: string | null;
};
