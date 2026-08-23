export type DailyChallenge = {
  id: string;
  number: string;
  slug: string;
  title: string;
  sourceTitle: string;
  synopsis: string;
  context: string;
  durationSeconds: number;
  genre: string;
  ageRating: string;
  participantCount: number;
  quote: string;
  videoUrl: string;
  posterUrl: string;
  packAuthor: string;
  rightsStatus: 'unverified';
  roles: readonly { id: string; name: string; description: string; lineCount: number }[];
  modes: readonly {
    id: 'performance' | 'chaos';
    title: string;
    description: string;
    eyebrow: string;
  }[];
  script: readonly {
    id: string;
    startMs: number;
    endMs: number;
    text: string;
    direction: string;
  }[];
};

const challengeModes: DailyChallenge['modes'] = [
  { id: 'performance', title: 'Interpretação', description: 'Siga o texto e encontre a emoção certa para a cena.', eyebrow: 'Modo fiel' },
  { id: 'chaos', title: 'Modo caos', description: 'Improviso liberado: transforme completamente a situação.', eyebrow: 'Vale tudo' },
];

export const dailyChallenges: readonly DailyChallenge[] = [
  {
    id: 'pack-rato-e-lua', number: '101', slug: 'rato-e-lua', title: 'Uma declaração para a Lua',
    sourceTitle: 'Palavra Cantada — Rato e Lua',
    synopsis: 'Um rato apaixonado transforma a noite em palco para sua declaração.',
    context: 'Interprete o Rato enquanto ele declara seu amor à Lua em forma de canção.',
    durationSeconds: 48, genre: 'Musical', ageRating: 'L', participantCount: 0,
    quote: 'Lua minguante, Lua crescente...',
    videoUrl: '/dub-pack/rato-e-lua/scene.webm', posterUrl: '/dub-pack/rato-e-lua/poster.png',
    packAuthor: 'GabrielYkho', rightsStatus: 'unverified',
    roles: [{ id: 'rato-e-lua-rato', name: 'Rato', description: 'Romântico, musical e completamente apaixonado.', lineCount: 2 }],
    modes: challengeModes,
    script: [
      { id: 'rato-e-lua-line-1', startMs: 319, endMs: 9800, text: 'Lua minguante, Lua crescente. Declaro ser o seu mais lindo amante.', direction: 'Comece como uma serenata confiante.' },
      { id: 'rato-e-lua-line-2', startMs: 11267, endMs: 20500, text: 'Com você eu quero me casar. Fazer da noite escura o nosso altar.', direction: 'Aumente a emoção até o pedido final.' },
    ],
  },
  {
    id: 'pack-rato-e-lua-lua', number: '102', slug: 'rato-e-lua-lua', title: 'A resposta da Lua',
    sourceTitle: 'Palavra Cantada — Rato e Lua',
    synopsis: 'Depois da serenata do Rato, a Lua responde com sinceridade e um novo conselho.',
    context: 'Interprete a Lua com carinho, mas deixe claro que sua luz é passageira.',
    durationSeconds: 48, genre: 'Musical', ageRating: 'L', participantCount: 0,
    quote: 'Rato, meu querido rato...',
    videoUrl: '/dub-pack/rato-e-lua/scene.webm', posterUrl: '/dub-pack/rato-e-lua/poster.png',
    packAuthor: 'GabrielYkho', rightsStatus: 'unverified',
    roles: [{ id: 'rato-e-lua-lua', name: 'Lua', description: 'Gentil, sincera e consciente de que está sempre mudando.', lineCount: 2 }],
    modes: challengeModes,
    script: [
      { id: 'rato-e-lua-lua-line-1', startMs: 25374, endMs: 34800, text: 'Rato, meu querido rato. Eu não sou assim de fino trato. Pra selar este contrato, minha luz é passageira. Fico sempre por um triz.', direction: 'Responda com afeto e delicadeza.' },
      { id: 'rato-e-lua-lua-line-2', startMs: 35223, endMs: 40800, text: 'Mesmo quando estou inteira, vem a nuvem me cobrir. Ela, sim, nuvem faceira, é que lhe fará feliz.', direction: 'Finalize como quem oferece um conselho amigo.' },
    ],
  },
];

export function getDailyChallenge(date = new Date()) {
  const dateKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
  const [year, month, day] = dateKey.split('-').map(Number);
  const start = Date.UTC(2026, 7, 23);
  const current = Date.UTC(year, month - 1, day);
  const daysSinceStart = Math.floor((current - start) / 86_400_000);
  const index = ((daysSinceStart % dailyChallenges.length) + dailyChallenges.length) % dailyChallenges.length;
  return dailyChallenges[index];
}

export const dailyChallenge = getDailyChallenge();
