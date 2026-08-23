'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameRoomState } from '../../lib/game-types';

export function GameRoom({ code }: { code: string }) {
  const [state, setState] = useState<GameRoomState | null>(null);
  const [error, setError] = useState('');
  const [working, setWorking] = useState('');
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/rooms/${code}`, { cache: 'no-store' });
    const body = await response.json() as GameRoomState & { message?: string };
    if (!response.ok) throw new Error(body.message ?? 'Não foi possível carregar a sala.');
    setState(body);
    setError('');
  }, [code]);

  useEffect(() => {
    let active = true;
    async function enter() {
      try {
        const response = await fetch(`/api/rooms/${code}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'join' }),
        });
        const body = await response.json() as GameRoomState & { message?: string };
        if (!response.ok) throw new Error(body.message ?? 'Não foi possível entrar na sala.');
        if (active) setState(body);
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Não foi possível entrar na sala.');
      }
    }
    void enter();
    const timer = window.setInterval(() => { if (active) void refresh().catch(() => undefined); }, 2000);
    return () => { active = false; window.clearInterval(timer); };
  }, [code, refresh]);

  async function action(name: 'start' | 'advance') {
    setWorking(name);
    setError('');
    try {
      const response = await fetch(`/api/rooms/${code}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: name }),
      });
      const body = await response.json() as GameRoomState & { message?: string };
      if (!response.ok) throw new Error(body.message ?? 'Não foi possível continuar.');
      setState(body);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível continuar.');
    } finally {
      setWorking('');
    }
  }

  async function copyInvite() {
    const url = `${window.location.origin}/sala/${code}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { window.prompt('Copie o link da sala:', url); }
  }

  if (!state) return <RoomLoading error={error} />;
  return (
    <section className="room-shell">
      <RoomTopbar state={state} copied={copied} onCopy={copyInvite} />
      {error && <p className="room-error" role="alert">{error}</p>}
      {state.room.status === 'lobby' && <Lobby state={state} working={working} onStart={() => action('start')} />}
      {(state.room.status === 'starting') && <RoomLoading />}
      {state.room.status === 'playing' && state.round && <RecordingRound key={state.round.id} code={code} state={state} onRefresh={refresh} />}
      {state.room.status === 'playback' && state.round && <PlaybackRound key={state.round.id} state={state} working={working} onAdvance={() => action('advance')} />}
      {state.room.status === 'finished' && <FinishedRoom state={state} />}
    </section>
  );
}

function RoomTopbar({ state, copied, onCopy }: { state: GameRoomState; copied: boolean; onCopy: () => void }) {
  return (
    <div className="room-topbar">
      <div><p className="content-label">MODO CLÁSSICO</p><strong>Sala {state.room.code}</strong></div>
      <div className="round-pips" aria-label={`Rodada ${state.room.currentRound || 0} de ${state.room.totalRounds}`}>
        {Array.from({ length: state.room.totalRounds }, (_, index) => <i className={index < state.room.currentRound ? 'active' : ''} key={index} />)}
        <span>{state.room.currentRound || '—'}/{state.room.totalRounds}</span>
      </div>
      <button className="invite-button" type="button" onClick={onCopy}>{copied ? 'Link copiado ✓' : 'Copiar convite'}</button>
    </div>
  );
}

function Lobby({ state, working, onStart }: { state: GameRoomState; working: string; onStart: () => void }) {
  const empty = state.room.maxPlayers - state.players.length;
  return (
    <div className="lobby-grid">
      <div className="lobby-copy"><p className="game-kicker"><span /> SALA ABERTA</p><h1>Junte as vozes.<br /><span>O caos vem depois.</span></h1><p>Envie o convite. Quando estiverem prontos, o anfitrião inicia cinco cenas aleatórias para todos.</p><div className="room-code-card"><small>CÓDIGO DA SALA</small><strong>{state.room.code}</strong></div></div>
      <div className="players-panel"><div><span>JOGADORES</span><strong>{state.players.length}/{state.room.maxPlayers}</strong></div><div className="player-list">
        {state.players.map((player) => <article key={player.id}><span>{initials(player.displayName)}</span><div><strong>{player.displayName}</strong><small>{player.id === state.me.id ? 'Você' : player.seat === 1 ? 'Anfitrião' : `Jogador ${player.seat}`}</small></div><i>PRONTO</i></article>)}
        {Array.from({ length: Math.min(empty, 3) }, (_, index) => <article className="empty-player" key={index}><span>+</span><div><strong>Aguardando voz…</strong><small>Compartilhe o link</small></div></article>)}
      </div>{state.me.isHost ? <button className="primary-button lobby-start" type="button" onClick={onStart} disabled={Boolean(working)}>{working ? 'Preparando cenas…' : 'Começar partida →'}</button> : <p className="host-wait">Aguardando o anfitrião começar…</p>}</div>
    </div>
  );
}

function RecordingRound({ code, state, onRefresh }: { code: string; state: GameRoomState; onRefresh: () => Promise<void> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const [recording, setRecording] = useState(false);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [durationMs, setDurationMs] = useState(0);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const submitted = state.players.find((player) => player.id === state.me.id)?.submitted;

  useEffect(() => {
    if (!audio) { setAudioUrl(''); return; }
    const url = URL.createObjectURL(audio); setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audio]);

  useEffect(() => () => { recorderRef.current?.state === 'recording' && recorderRef.current.stop(); streamRef.current?.getTracks().forEach((track) => track.stop()); }, []);

  async function startRecording() {
    setMessage(''); setAudio(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream; chunksRef.current = [];
      const preferred = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : '';
      const recorder = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const elapsed = Math.max(250, Date.now() - startedAtRef.current);
        setDurationMs(elapsed); setAudio(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }));
        stream.getTracks().forEach((track) => track.stop()); setRecording(false);
      };
      startedAtRef.current = Date.now(); recorder.start(250); setRecording(true);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = true;
        void videoRef.current.play().catch(() => setMessage('Toque novamente para iniciar o vídeo.'));
      }
    } catch {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setMessage('Não consegui acessar o microfone. Verifique a permissão do navegador.');
    }
  }

  function stopRecording() {
    videoRef.current?.pause();
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }

  async function submit() {
    if (!audio) return;
    setSending(true); setMessage('');
    const form = new FormData();
    form.append('audio', new File([audio], 'dublagem.webm', { type: audio.type || 'audio/webm' }));
    form.append('durationMs', String(durationMs));
    try {
      const response = await fetch(`/api/rooms/${code}/submit`, { method: 'POST', body: form });
      const body = await response.json() as { message?: string };
      if (!response.ok) throw new Error(body.message ?? 'Não foi possível enviar sua dublagem.');
      await onRefresh();
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Não foi possível enviar.'); }
    finally { setSending(false); }
  }

  return (
    <div className="round-stage">
      <div className="round-heading"><div><p className="content-label">RODADA {state.round!.number} DE {state.room.totalRounds}</p><h1>{state.round!.scene.title}</h1><p>{state.round!.scene.sourceTitle} · {state.round!.scene.genre} · {formatTime(state.round!.scene.durationSeconds)}</p></div><SubmissionStatus state={state} /></div>
      <div className="recording-room-grid"><div className="multiplayer-video"><video ref={videoRef} src={state.round!.scene.videoUrl} poster={state.round!.scene.posterUrl} playsInline preload="metadata" onEnded={stopRecording} /><span className="muted-badge">VÍDEO SEM ÁUDIO</span></div>
      <aside className="dub-console"><p className="content-label">SUA VEZ DE DUBLAR</p>{submitted ? <div className="submitted-card"><span>✓</span><h2>Dublagem enviada</h2><p>Quando todos terminarem, as versões começam automaticamente.</p></div> : <><h2>{recording ? 'Gravando sua voz…' : audio ? 'Gostou da versão?' : 'Pronto para entrar em cena?'}</h2><p>{recording ? 'A gravação termina junto com o vídeo, mas você pode parar antes.' : 'Use fones de ouvido. O vídeo roda mudo enquanto o microfone captura sua interpretação.'}</p>{recording ? <button className="stop-record-button" type="button" onClick={stopRecording}><i /> Parar gravação</button> : !audio ? <button className="record-room-button" type="button" onClick={startRecording}><i /> Gravar dublagem</button> : <div className="take-review"><audio src={audioUrl} controls /><button type="button" onClick={() => setAudio(null)}>Gravar de novo</button><button className="primary-button" type="button" onClick={submit} disabled={sending}>{sending ? 'Enviando…' : 'Enviar para a sala →'}</button></div>}{message && <p className="room-error" role="alert">{message}</p>}</>}</aside></div>
    </div>
  );
}

function PlaybackRound({ state, working, onAdvance }: { state: GameRoomState; working: string; onAdvance: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const current = state.submissions[index];

  async function playCurrent() {
    if (!current || !videoRef.current || !audioRef.current) return;
    videoRef.current.currentTime = 0; audioRef.current.currentTime = 0; videoRef.current.muted = true;
    setRunning(true);
    await Promise.allSettled([videoRef.current.play(), audioRef.current.play()]);
  }

  function nextVersion() {
    audioRef.current?.pause();
    if (index + 1 >= state.submissions.length) { setRunning(false); setDone(true); return; }
    setIndex((value) => value + 1); setRunning(false);
  }

  useEffect(() => { if (index > 0 && !done) void playCurrent(); }, [index]); // sequência disparada pelo fim do vídeo anterior

  return (
    <div className="playback-stage"><div className="playback-heading"><p className="game-kicker"><span /> SESSÃO DA RODADA {state.round!.number}</p><h1>Agora, cada voz<br /><span>ganha a tela.</span></h1><p>As versões aparecem na ordem em que os jogadores entraram na sala.</p></div>
      <div className="playback-card"><div className="playback-now"><span>{done ? 'SESSÃO CONCLUÍDA' : running ? 'AGORA NA TELA' : 'PRONTOS PARA ASSISTIR'}</span><strong>{done ? `${state.submissions.length} versões assistidas` : current?.displayName}</strong><small>{done ? 'O anfitrião pode avançar.' : `Versão ${index + 1} de ${state.submissions.length}`}</small></div>
        <video key={`video-${index}`} ref={videoRef} src={state.round!.scene.videoUrl} poster={state.round!.scene.posterUrl} playsInline onEnded={nextVersion} />
        {current && <audio key={`audio-${current.id}`} ref={audioRef} src={current.audioUrl} />}
        {!running && !done && <button className="play-session-button" type="button" onClick={playCurrent}>▶ {index === 0 ? 'Começar sessão' : 'Continuar'}</button>}
      </div>
      <div className="playback-roster">{state.submissions.map((submission, itemIndex) => <span className={itemIndex < index || done ? 'played' : itemIndex === index ? 'current' : ''} key={submission.id}><i>{initials(submission.displayName)}</i>{submission.displayName}</span>)}</div>
      {done && (state.me.isHost ? <button className="primary-button next-round-button" type="button" onClick={onAdvance} disabled={Boolean(working)}>{working ? 'Preparando…' : state.room.currentRound === state.room.totalRounds ? 'Encerrar partida →' : 'Próxima cena →'}</button> : <p className="host-wait">Aguardando o anfitrião avançar…</p>)}
    </div>
  );
}

function SubmissionStatus({ state }: { state: GameRoomState }) {
  const count = state.players.filter((player) => player.submitted).length;
  return <div className="submission-status"><span>{count}/{state.players.length}</span><small>DUBLAGENS<br />ENVIADAS</small></div>;
}

function FinishedRoom({ state }: { state: GameRoomState }) {
  return <div className="finished-room"><span>✦</span><p className="content-label">PARTIDA CONCLUÍDA</p><h1>Cinco cenas.<br /><strong>{state.players.length} vozes inesquecíveis.</strong></h1><p>A sala terminou o modo Clássico. Volte ao início para criar outra combinação aleatória.</p><a className="primary-button" href="/">Jogar novamente →</a></div>;
}

function RoomLoading({ error }: { error?: string }) {
  return <div className="room-loading"><i /><strong>{error ?? 'Abrindo a sala…'}</strong>{error && <a href="/">Voltar ao início</a>}</div>;
}

function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'VV'; }
function formatTime(seconds: number) { return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`; }
