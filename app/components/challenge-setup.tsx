'use client';

import { useState } from 'react';
import type { DubScene } from '../../lib/scenes';

type ChallengeSetupProps = {
  challenge: DubScene;
};

export function ChallengeSetup({ challenge }: ChallengeSetupProps) {
  const [mode, setMode] = useState<(typeof challenge.modes)[number]['id']>('performance');
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) {
    const chosenMode = challenge.modes.find((item) => item.id === mode)!;
    return (
      <section className="setup-confirmation" aria-live="polite">
        <span className="confirmation-mark" aria-hidden="true">✓</span>
        <p className="content-label">ESCOLHA CONFIRMADA</p>
        <h2>Seu palco está preparado.</h2>
        <p>
          Você vai interpretar <strong>{challenge.roles[0].name}</strong> no modo{' '}
          <strong>{chosenMode.title}</strong>. Faça um teste rápido do microfone e grave cada fala no seu tempo.
        </p>
        <div className="confirmation-actions">
          <a className="confirm-button" href={`/estudio?scene=${challenge.slug}&mode=${mode}`}>
            Entrar no estúdio <span aria-hidden="true">→</span>
          </a>
          <button className="secondary-button" type="button" onClick={() => setConfirmed(false)}>
            Alterar escolha
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="challenge-setup" aria-labelledby="setup-title">
      <div className="setup-heading">
        <div>
          <p className="content-label">PREPARE SUA VERSÃO</p>
          <h2 id="setup-title">Como você quer entrar em cena?</h2>
        </div>
        <span className="setup-step">1 de 2</span>
      </div>

      <fieldset className="mode-options">
        <legend className="sr-only">Escolha o modo de dublagem</legend>
        {challenge.modes.map((item) => (
          <label className={`mode-card ${mode === item.id ? 'selected' : ''}`} key={item.id}>
            <input
              type="radio"
              name="dubbing-mode"
              value={item.id}
              checked={mode === item.id}
              onChange={() => setMode(item.id)}
            />
            <span className="mode-radio" aria-hidden="true" />
            <span className="mode-copy">
              <small>{item.eyebrow}</small>
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="role-summary">
        <span className="role-avatar" aria-hidden="true">VV</span>
        <span><small>SEU PERSONAGEM</small><strong>{challenge.roles[0].name}</strong></span>
        <p>{challenge.roles[0].description}</p>
        <span className="line-count">{challenge.roles[0].lineCount} falas</span>
      </div>

      <button className="confirm-button" type="button" onClick={() => setConfirmed(true)}>
        Confirmar e preparar o estúdio <span aria-hidden="true">→</span>
      </button>
      <p className="privacy-note">O microfone só será ativado quando você entrar no estúdio.</p>
    </section>
  );
}
