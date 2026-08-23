export const dailyChallenge = {
  id: 'challenge-001',
  number: '001',
  slug: 'o-ultimo-sinal',
  title: 'O último sinal',
  sourceTitle: 'Cena demonstrativa',
  synopsis: 'Uma transmissão misteriosa. Uma última chance de ser ouvido.',
  context:
    'Depois de horas tentando contato, Lia escuta uma resposta vindo de uma frequência que deveria estar vazia.',
  durationSeconds: 18,
  genre: 'Drama',
  ageRating: '12',
  participantCount: 1284,
  quote: 'Às vezes, tudo que falta é alguém responder...',
  roles: [
    {
      id: 'lia',
      name: 'Lia',
      description: 'Operadora de rádio tentando manter a calma.',
      lineCount: 3,
    },
  ],
  modes: [
    {
      id: 'performance',
      title: 'Interpretação',
      description: 'Siga o texto e encontre a emoção certa para a cena.',
      eyebrow: 'Modo fiel',
    },
    {
      id: 'chaos',
      title: 'Modo caos',
      description: 'Improviso liberado: transforme completamente a situação.',
      eyebrow: 'Vale tudo',
    },
  ],
  script: [
    { id: 'line-1', startMs: 1200, endMs: 5200, text: 'Alô? Tem alguém nessa frequência?' },
    { id: 'line-2', startMs: 7800, endMs: 12100, text: 'Eu achei que nunca ouviria outra voz.' },
    { id: 'line-3', startMs: 13700, endMs: 17600, text: 'Espera... você sabe onde eu estou?' },
  ],
} as const;

export type DailyChallenge = typeof dailyChallenge;
