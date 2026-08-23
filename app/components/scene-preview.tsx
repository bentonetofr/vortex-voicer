'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DailyChallenge } from '../../lib/daily-challenge';

export function ScenePreview({ challenge }: { challenge: DailyChallenge }) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => {
      setElapsed((current) => {
        if (current >= challenge.durationSeconds - 1) {
          setPlaying(false);
          return challenge.durationSeconds;
        }
        return current + 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [playing, challenge.durationSeconds]);

  const activeLine = useMemo(() => {
    const elapsedMs = elapsed * 1000;
    return challenge.script.find((line) => elapsedMs >= line.startMs && elapsedMs <= line.endMs)?.text
      ?? challenge.quote;
  }, [challenge, elapsed]);

  const togglePlayback = () => {
    if (elapsed >= challenge.durationSeconds) setElapsed(0);
    setPlaying((current) => !current);
  };

  return (
    <div className="challenge-player">
      <div className={`player-scene ${playing ? 'is-playing' : ''}`}>
        <div className="scene-glow" />
        <div className="scene-window" />
        <div className="scene-silhouette scene-silhouette-left" />
        <div className="scene-silhouette scene-silhouette-right" />
        <span className="demo-label">CENA DEMONSTRATIVA</span>
        <button
          className="player-button"
          type="button"
          onClick={togglePlayback}
          aria-label={playing ? 'Pausar referência da cena' : 'Reproduzir referência da cena'}
        >
          <span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span>
        </button>
        <div className="player-subtitle">“{activeLine}”</div>
      </div>
      <div className="player-controls" aria-label="Controles da cena">
        <button type="button" onClick={togglePlayback} aria-label={playing ? 'Pausar' : 'Reproduzir'}>
          {playing ? 'Ⅱ' : '▶'}
        </button>
        <span className="player-time">00:{String(elapsed).padStart(2, '0')}</span>
        <span className="player-progress" aria-hidden="true">
          <i style={{ width: `${(elapsed / challenge.durationSeconds) * 100}%` }} />
        </span>
        <span className="player-time">00:{challenge.durationSeconds}</span>
        <span className="volume-indicator" aria-label="Volume ligado">))</span>
      </div>
    </div>
  );
}
