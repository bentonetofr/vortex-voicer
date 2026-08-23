'use client';

import { useMemo, useState } from 'react';
import type { DubScene } from '../../lib/scenes';

const filters = ['Todos', 'Filmes', 'Séries', 'Animações', 'Memes'] as const;

export function SceneLibrary({ scenes }: { scenes: readonly DubScene[] }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof filters)[number]>('Todos');
  const visibleScenes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    return scenes.filter((scene) => {
      const matchesFilter = filter === 'Todos' || scene.category === filter;
      const haystack = `${scene.title} ${scene.sourceTitle} ${scene.genre}`.toLocaleLowerCase('pt-BR');
      return matchesFilter && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [filter, query, scenes]);

  return (
    <>
      <div className="scene-toolbar" aria-label="Ferramentas da biblioteca">
        <label className="scene-search">
          <span aria-hidden="true">⌕</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cena, filme ou personagem" aria-label="Buscar cenas" />
        </label>
        <div className="scene-filters" aria-label="Filtros">
          {filters.map((item) => <button className={filter === item ? 'active' : ''} type="button" onClick={() => setFilter(item)} key={item}>{item}</button>)}
        </div>
      </div>

      <p className="scene-results" aria-live="polite">{visibleScenes.length} {visibleScenes.length === 1 ? 'cena encontrada' : 'cenas encontradas'}</p>
      {visibleScenes.length ? (
        <div className="scene-grid">
          {visibleScenes.map((scene) => (
            <article className="scene-card" key={scene.id}>
              <a className="scene-card-media" href={`/desafio?scene=${scene.slug}`}>
                <img src={scene.posterUrl} alt="" loading="lazy" />
                <span className="scene-card-play">▶</span>
                <span className="scene-duration">{formatDuration(scene.durationSeconds)}</span>
              </a>
              <div className="scene-card-copy">
                <p>{scene.sourceTitle}<span>{scene.ageRating}</span></p>
                <h3><a href={`/desafio?scene=${scene.slug}`}>{scene.title}</a></h3>
                <div><span>{scene.genre}</span><a href={`/desafio?scene=${scene.slug}`}>Dublar agora <b>→</b></a></div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="scene-empty"><span>◎</span><h3>Nenhuma cena por aqui.</h3><p>Tente outro termo ou escolha “Todos”.</p></div>
      )}
    </>
  );
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
