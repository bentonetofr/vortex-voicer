'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DubScene } from '../../lib/scenes';

type MicState = 'idle' | 'requesting' | 'ready' | 'denied' | 'unsupported';
type StudioPhase = 'setup' | 'recording' | 'review';
type Take = { blob: Blob; url: string; durationMs: number };

const meterBars = Array.from({ length: 24 }, (_, index) => index);

export function RecordingStudio({ challenge }: { challenge: DubScene }) {
  const [phase, setPhase] = useState<StudioPhase>('setup');
  const [micState, setMicState] = useState<MicState>('idle');
  const [micLevel, setMicLevel] = useState(0);
  const [modeTitle, setModeTitle] = useState('Interpretação');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [takes, setTakes] = useState<Record<string, Take>>({});
  const [countdown, setCountdown] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [sceneTimeMs, setSceneTimeMs] = useState(0);
  const [playingTake, setPlayingTake] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [finished, setFinished] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const meterFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioPlayersRef = useRef<HTMLAudioElement[]>([]);
  const sceneVideoRef = useRef<HTMLVideoElement | null>(null);
  const takeUrlsRef = useRef<Set<string>>(new Set());
  const reviewStartedAtRef = useRef(0);
  const firedLinesRef = useRef<Set<string>>(new Set());

  const currentLine = challenge.script[currentLineIndex];
  const recordedCount = Object.keys(takes).length;
  const allRecorded = recordedCount === challenge.script.length;

  useEffect(() => {
    const mode = new URLSearchParams(window.location.search).get('mode');
    setModeTitle(mode === 'chaos' ? 'Modo caos' : 'Interpretação');

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (meterFrameRef.current) window.cancelAnimationFrame(meterFrameRef.current);
      if (recordTimerRef.current) window.clearTimeout(recordTimerRef.current);
      if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
      audioPlayersRef.current.forEach((audio) => audio.pause());
      sceneVideoRef.current?.pause();
      takeUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      void audioContextRef.current?.close();
    };
  }, []);

  const beginMeter = (stream: MediaStream) => {
    const AudioContextClass = window.AudioContext;
    const context = new AudioContextClass();
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    context.createMediaStreamSource(stream).connect(analyser);
    audioContextRef.current = context;
    const values = new Uint8Array(analyser.frequencyBinCount);

    const update = () => {
      analyser.getByteFrequencyData(values);
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      setMicLevel(Math.min(1, average / 90));
      meterFrameRef.current = window.requestAnimationFrame(update);
    };
    update();
  };

  const requestMicrophone = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMicState('unsupported');
      return;
    }

    setMicState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      beginMeter(stream);
      setMicState('ready');
    } catch {
      setMicState('denied');
    }
  };

  const clearRecordingTimers = () => {
    if (recordTimerRef.current) window.clearTimeout(recordTimerRef.current);
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    recordTimerRef.current = null;
    progressTimerRef.current = null;
  };

  const finishRecording = () => {
    clearRecordingTimers();
    sceneVideoRef.current?.pause();
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const startRecording = async () => {
    const stream = streamRef.current;
    if (!stream || isRecording) return;

    setCountdown(3);
    for (let value = 3; value > 0; value -= 1) {
      setCountdown(value);
      await new Promise((resolve) => window.setTimeout(resolve, 650));
    }
    setCountdown(0);

    const mimeCandidates = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'];
    const mimeType = mimeCandidates.find((type) => MediaRecorder.isTypeSupported(type));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;
    chunksRef.current = [];
    const line = challenge.script[currentLineIndex];
    const takeDuration = line.endMs - line.startMs;

    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      const url = URL.createObjectURL(blob);
      takeUrlsRef.current.add(url);
      setTakes((current) => {
        const previous = current[line.id];
        if (previous) {
          URL.revokeObjectURL(previous.url);
          takeUrlsRef.current.delete(previous.url);
        }
        return { ...current, [line.id]: { blob, url, durationMs: takeDuration } };
      });
      setIsRecording(false);
      setSceneTimeMs(line.endMs);
      const nextMissing = challenge.script.findIndex((item, index) => index > currentLineIndex && !takes[item.id]);
      if (nextMissing >= 0) setCurrentLineIndex(nextMissing);
    };

    recorder.start();
    setIsRecording(true);
    if (sceneVideoRef.current) {
      sceneVideoRef.current.currentTime = line.startMs / 1000;
      sceneVideoRef.current.muted = true;
      void sceneVideoRef.current.play();
    }
    const startedAt = performance.now();
    setSceneTimeMs(line.startMs);
    progressTimerRef.current = window.setInterval(() => {
      setSceneTimeMs(Math.min(line.endMs, line.startMs + performance.now() - startedAt));
    }, 50);
    recordTimerRef.current = window.setTimeout(finishRecording, takeDuration);
  };

  const playTake = (lineId: string) => {
    const take = takes[lineId];
    if (!take) return;
    audioPlayersRef.current.forEach((audio) => audio.pause());
    const audio = new Audio(take.url);
    audioPlayersRef.current = [audio];
    setPlayingTake(lineId);
    audio.onended = () => setPlayingTake(null);
    void audio.play();
  };

  const stopReview = () => {
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    progressTimerRef.current = null;
    audioPlayersRef.current.forEach((audio) => audio.pause());
    audioPlayersRef.current = [];
    sceneVideoRef.current?.pause();
    setIsReviewing(false);
  };

  const setMicrophoneEnabled = (enabled: boolean) => {
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  };

  const startReview = () => {
    if (isReviewing) {
      stopReview();
      return;
    }
    setFinished(false);
    setSceneTimeMs(0);
    setIsReviewing(true);
    if (sceneVideoRef.current) {
      sceneVideoRef.current.currentTime = 0;
      sceneVideoRef.current.muted = true;
      void sceneVideoRef.current.play();
    }
    firedLinesRef.current = new Set();
    reviewStartedAtRef.current = performance.now();

    progressTimerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - reviewStartedAtRef.current;
      setSceneTimeMs(Math.min(challenge.durationSeconds * 1000, elapsed));

      challenge.script.forEach((line) => {
        const take = takes[line.id];
        if (take && elapsed >= line.startMs && !firedLinesRef.current.has(line.id)) {
          firedLinesRef.current.add(line.id);
          const audio = new Audio(take.url);
          audioPlayersRef.current.push(audio);
          void audio.play();
        }
      });

      if (elapsed >= challenge.durationSeconds * 1000) {
        stopReview();
        setSceneTimeMs(challenge.durationSeconds * 1000);
      }
    }, 50);
  };

  const reviewLine = useMemo(() => {
    return challenge.script.find((line) => sceneTimeMs >= line.startMs && sceneTimeMs <= line.endMs)?.text
      ?? 'Sua versão está entrando em cena.';
  }, [challenge.script, sceneTimeMs]);

  const downloadTakes = () => {
    challenge.script.forEach((line, index) => {
      const take = takes[line.id];
      if (!take) return;
      const link = document.createElement('a');
      link.href = take.url;
      link.download = `${challenge.slug}-voz-${index + 1}.webm`;
      link.click();
    });
  };

  if (phase === 'setup') {
    return (
      <section className="mic-setup" aria-labelledby="mic-title">
          <div className="studio-step-label"><span>1</span> Preparação do microfone</div>
        <div className="mic-visual" aria-hidden="true">
          <span className={`studio-mic ${micState === 'ready' ? 'active' : ''}`} />
          <div className="meter-bars">
            {meterBars.map((bar) => (
              <i key={bar} className={bar / meterBars.length < micLevel ? 'active' : ''} />
            ))}
          </div>
        </div>
        <p className="content-label">TESTE DE SOM</p>
        <h1 id="mic-title">Vamos ouvir sua voz.</h1>
        <p className="mic-description">
          Permita o acesso ao microfone e faça um teste. Sua gravação continuará somente neste dispositivo.
        </p>

        {micState === 'ready' ? (
          <div className="mic-ready">
            <span><i /> Microfone conectado</span>
            <button className="confirm-button" type="button" onClick={() => setPhase('recording')}>
              Começar a gravar <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : (
          <button
            className="confirm-button mic-permission-button"
            type="button"
            onClick={requestMicrophone}
            disabled={micState === 'requesting'}
          >
            <span className="button-mic" aria-hidden="true" />
            {micState === 'requesting' ? 'Aguardando permissão...' : 'Ativar meu microfone'}
          </button>
        )}

        {micState === 'denied' && (
          <p className="mic-error" role="alert">O acesso foi bloqueado. Libere o microfone nas configurações do navegador e tente novamente.</p>
        )}
        {micState === 'unsupported' && (
          <p className="mic-error" role="alert">Este navegador não oferece a gravação necessária. Tente uma versão atual do Chrome, Edge ou Safari.</p>
        )}
      </section>
    );
  }

  if (phase === 'review') {
    return (
      <section className="studio-review" aria-labelledby="review-title">
        <div className="studio-heading-row">
          <div><p className="content-label">REVISÃO FINAL</p><h1 id="review-title">Sua voz encontrou a cena.</h1></div>
          <span className="studio-mode">{modeTitle}</span>
        </div>

        <div className="review-stage">
          <div className={`studio-scene ${isReviewing ? 'is-live' : ''}`}>
            <video ref={sceneVideoRef} className="pack-scene-video" src={challenge.videoUrl} poster={challenge.posterUrl} muted playsInline preload="metadata" />
            <span className="review-badge">SUA DUBLAGEM</span>
            <div className="studio-subtitle">“{reviewLine}”</div>
          </div>
          <div className="review-controls">
            <button type="button" className="review-play" onClick={startReview} aria-label={isReviewing ? 'Pausar revisão' : 'Reproduzir revisão'}>
              {isReviewing ? 'Ⅱ' : '▶'}
            </button>
            <span>{formatTime(sceneTimeMs)}</span>
            <div className="studio-progress"><i style={{ width: `${(sceneTimeMs / (challenge.durationSeconds * 1000)) * 100}%` }} /></div>
            <span>{formatTime(challenge.durationSeconds * 1000)}</span>
          </div>
        </div>

        {finished ? (
          <div className="publish-panel" aria-live="polite">
            <div className="review-complete">
              <span>✓</span>
              <div><strong>Dublagem pronta</strong><small>Suas gravações continuam somente neste dispositivo.</small></div>
            </div>
            <div className="publish-fields local-export">
              <p>Baixe suas tomadas de voz para editar, guardar ou compartilhar onde quiser. Nenhuma conta é necessária.</p>
              <button className="confirm-button" type="button" onClick={downloadTakes}>Baixar minhas falas <span aria-hidden="true">↓</span></button>
              <a className="secondary-button" href="/#cenas">Escolher outra cena</a>
            </div>
          </div>
        ) : (
          <p className="review-help">Suas tomadas são reproduzidas automaticamente no momento certo da cena.</p>
        )}

        <div className="review-actions">
          <button className="secondary-button" type="button" onClick={() => { stopReview(); setMicrophoneEnabled(true); setPhase('recording'); }}>
            Voltar às tomadas
          </button>
          <button className="confirm-button" type="button" disabled={finished} onClick={() => { stopReview(); setFinished(true); }}>
            Concluir revisão <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="recording-workspace" aria-labelledby="recording-title">
      <div className="studio-heading-row">
        <div>
          <p className="content-label">ESTÚDIO DE DUBLAGEM</p>
          <h1 id="recording-title">Dê voz à cena inteira.</h1>
        </div>
        <div className="studio-session-meta"><span>{modeTitle}</span><strong>{recordedCount}/{challenge.script.length} falas</strong></div>
      </div>

      <div className="recording-grid">
        <div className="recording-stage-card">
          <div className={`studio-scene ${isRecording ? 'is-live' : ''}`}>
            <video ref={sceneVideoRef} className="pack-scene-video" src={challenge.videoUrl} poster={challenge.posterUrl} muted playsInline preload="metadata" />
            <span className={`recording-status ${isRecording ? 'active' : ''}`}><i />{isRecording ? 'GRAVANDO' : 'PRONTO'}</span>
            {countdown > 0 && <span className="take-countdown" aria-live="assertive">{countdown}</span>}
            <div className="studio-subtitle">“{currentLine.text}”</div>
          </div>
          <div className="line-timeline" aria-label="Posição da fala na cena">
            <span>00:00</span>
            <div>
              <i className="line-window" style={{ left: `${(currentLine.startMs / (challenge.durationSeconds * 1000)) * 100}%`, width: `${((currentLine.endMs - currentLine.startMs) / (challenge.durationSeconds * 1000)) * 100}%` }} />
              <b style={{ left: `${(sceneTimeMs / (challenge.durationSeconds * 1000)) * 100}%` }} />
            </div>
            <span>{formatTime(challenge.durationSeconds * 1000)}</span>
          </div>
        </div>

        <aside className="take-panel">
          <div className="current-take-heading">
            <span>FALA {currentLineIndex + 1} DE {challenge.script.length}</span>
            <small>{((currentLine.endMs - currentLine.startMs) / 1000).toFixed(1)}s</small>
          </div>
          <blockquote>{currentLine.text}</blockquote>
          <p className="direction-note">Intenção: {currentLine.direction}</p>

          <div className={`record-action ${isRecording ? 'is-recording' : ''}`}>
            <button type="button" onClick={isRecording ? finishRecording : startRecording} disabled={countdown > 0}>
              <i aria-hidden="true" />
              <span>{isRecording ? 'Parar tomada' : takes[currentLine.id] ? 'Gravar novamente' : 'Gravar esta fala'}</span>
            </button>
            <div className="mini-meter" aria-hidden="true">
              {meterBars.slice(0, 12).map((bar) => <i key={bar} className={bar / 12 < micLevel ? 'active' : ''} />)}
            </div>
          </div>
          <p className="auto-stop-note">A gravação para automaticamente no fim da fala.</p>
        </aside>
      </div>

      <div className="takes-list" aria-label="Suas tomadas">
        {challenge.script.map((line, index) => {
          const take = takes[line.id];
          return (
            <article className={`${currentLineIndex === index ? 'current' : ''} ${take ? 'recorded' : ''}`} key={line.id}>
              <button className="take-select" type="button" onClick={() => setCurrentLineIndex(index)} disabled={isRecording}>
                <span>{take ? '✓' : index + 1}</span>
                <div><small>FALA {index + 1}</small><strong>{line.text}</strong></div>
              </button>
              {take && (
                <button className="take-play" type="button" onClick={() => playTake(line.id)} aria-label={`Ouvir fala ${index + 1}`}>
                  {playingTake === line.id ? 'Ⅱ' : '▶'}
                </button>
              )}
            </article>
          );
        })}
      </div>

      <div className="studio-footer-actions">
        <span><i /> Os áudios ainda estão somente neste dispositivo.</span>
        <button className="confirm-button" type="button" disabled={!allRecorded || isRecording} onClick={() => { stopReview(); setMicrophoneEnabled(false); setSceneTimeMs(0); setPhase('review'); }}>
          Revisar cena completa <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}

function formatTime(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
