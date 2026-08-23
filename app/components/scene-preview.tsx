'use client';

import { useMemo, useRef, useState } from 'react';
import type { DubScene } from '../../lib/scenes';

export function ScenePreview({ challenge }: { challenge: DubScene }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(challenge.durationSeconds);
  const [muted, setMuted] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  const activeLine = useMemo(() => {
    const elapsedMs = elapsed * 1000;
    return challenge.script.find((line) => elapsedMs >= line.startMs && elapsedMs <= line.endMs)?.text
      ?? challenge.quote;
  }, [challenge, elapsed]);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video || unsupported) return;
    if (video.paused) {
      if (video.ended || video.currentTime >= duration) video.currentTime = 0;
      await video.play().catch(() => setUnsupported(true));
    } else {
      video.pause();
    }
  };

  const toggleVolume = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  return (
    <div className="challenge-player">
      <div className={`player-scene has-pack-video ${playing ? 'is-playing' : ''}`}>
        <video
          ref={videoRef}
          className="pack-scene-video"
          playsInline
          preload="metadata"
          poster={challenge.posterUrl}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => {
            if (Number.isFinite(event.currentTarget.duration)) setDuration(Math.ceil(event.currentTarget.duration));
          }}
          onError={() => setUnsupported(true)}
        >
          <source src={challenge.videoUrl} type="video/webm" />
        </video>
        <span className="demo-label">PACK BR · REFERÊNCIA</span>
        <button
          className="player-button"
          type="button"
          onClick={togglePlayback}
          aria-label={playing ? 'Pausar referência da cena' : 'Reproduzir referência da cena'}
        >
          <span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span>
        </button>
        <div className="player-subtitle">“{activeLine}”</div>
        {unsupported && <p className="video-fallback" role="alert">Este navegador não conseguiu abrir o vídeo do pack.</p>}
      </div>
      <div className="player-controls" aria-label="Controles da cena">
        <button type="button" onClick={togglePlayback} aria-label={playing ? 'Pausar' : 'Reproduzir'}>
          {playing ? 'Ⅱ' : '▶'}
        </button>
        <span className="player-time">{formatTime(elapsed)}</span>
        <span className="player-progress" aria-hidden="true">
          <i style={{ width: `${Math.min(100, (elapsed / duration) * 100)}%` }} />
        </span>
        <span className="player-time">{formatTime(duration)}</span>
        <button className="volume-indicator" type="button" onClick={toggleVolume} aria-label={muted ? 'Ativar som' : 'Silenciar'}>
          {muted ? '×' : '))'}
        </button>
      </div>
    </div>
  );
}

function formatTime(seconds: number) {
  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(wholeSeconds % 60).padStart(2, '0')}`;
}
