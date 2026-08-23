'use client';

import { FormEvent, useState } from 'react';

export function ModeLauncher({ playerName }: { playerName: string }) {
  const [classicOpen, setClassicOpen] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState('');

  async function createRoom() {
    setBusy('create');
    setError('');
    try {
      const response = await fetch('/api/rooms', { method: 'POST' });
      const body = await response.json() as { code?: string; message?: string };
      if (!response.ok || !body.code) throw new Error(body.message ?? 'Não foi possível criar a sala.');
      window.location.assign(`/sala/${body.code}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível criar a sala.');
      setBusy(null);
    }
  }

  async function joinRoom(event: FormEvent) {
    event.preventDefault();
    const code = roomCode.trim().toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(code)) {
      setError('Digite o código de 6 caracteres.');
      return;
    }
    setBusy('join');
    setError('');
    try {
      const response = await fetch(`/api/rooms/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join' }),
      });
      const body = await response.json() as { message?: string };
      if (!response.ok) throw new Error(body.message ?? 'Não foi possível entrar na sala.');
      window.location.assign(`/sala/${code}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível entrar na sala.');
      setBusy(null);
    }
  }

  return (
    <section className="mode-hub" id="modos" aria-labelledby="modes-title">
      <div className="mode-hub-heading">
        <div><p className="game-kicker"><span /> ATÉ 8 JOGADORES</p><h1 id="modes-title">Modos<br /><span>de jogo.</span></h1></div>
        <p>Olá, <strong>{playerName}</strong>. Crie uma sala ou entre com um código.</p>
      </div>

      <div className="game-mode-grid">
        <article className={`game-mode-card classic ${classicOpen ? 'selected' : ''}`}>
          <div className="mode-art"><span className="mode-orbit orbit-one" /><span className="mode-orbit orbit-two" /><strong>5</strong><small>CENAS</small></div>
          <div className="mode-copy"><p>DISPONÍVEL</p><h2>Clássico</h2><p>Cinco cenas aleatórias. Todos dublam e assistem às versões no fim de cada rodada.</p><div><span>2–8 jogadores</span><span>≈ 15 min</span></div></div>
          <button className="mode-select-button" type="button" onClick={() => setClassicOpen(true)}>Selecionar <span>→</span></button>
        </article>

        <article className="game-mode-card coming-soon" aria-disabled="true">
          <div><span>EM BREVE</span><h3>Outros modos</h3><p>Ainda não disponíveis.</p></div>
        </article>
      </div>

      {classicOpen && (
        <div className="classic-entry" id="classic" aria-live="polite">
          <div><p className="content-label">MODO CLÁSSICO</p><h2>Como você quer jogar?</h2><p>Crie uma sala nova ou entre com o código que recebeu de um amigo.</p></div>
          <div className="classic-entry-actions">
            <button className="primary-button" type="button" onClick={createRoom} disabled={Boolean(busy)}>{busy === 'create' ? 'Criando…' : 'Criar sala'}</button>
            <span>ou</span>
            <form onSubmit={joinRoom}>
              <label className="sr-only" htmlFor="room-code">Código da sala</label>
              <input id="room-code" maxLength={6} placeholder="CÓDIGO" value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''))} autoComplete="off" />
              <button type="submit" disabled={Boolean(busy)}>{busy === 'join' ? 'Entrando…' : 'Entrar'}</button>
            </form>
            {error && <p className="form-error" role="alert">{error}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
