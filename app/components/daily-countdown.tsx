'use client';

import { useEffect, useState } from 'react';

const saoPauloClock = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function timeUntilNextChallenge() {
  const parts = saoPauloClock.formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  const elapsedSeconds = value('hour') * 3600 + value('minute') * 60 + value('second');
  const remainingSeconds = Math.max(0, 86400 - elapsedSeconds);
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

export function DailyCountdown({ showLabel = false }: { showLabel?: boolean }) {
  const [remaining, setRemaining] = useState('--:--:--');

  useEffect(() => {
    const update = () => setRemaining(timeUntilNextChallenge());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <span className="live-countdown" aria-live="off" aria-label={`Próxima cena em ${remaining}`}>
      {showLabel && <small>PRÓXIMA CENA EM</small>}
      <strong>{remaining}</strong>
    </span>
  );
}
