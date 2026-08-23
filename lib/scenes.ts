import packCatalog from '../content/dub-pack-scenes.json';

export type DubScene = {
  id: string;
  slug: string;
  title: string;
  sourceTitle: string;
  description: string;
  genre: string;
  category: 'Filmes' | 'Séries' | 'Animações' | 'Memes';
  ageRating: string;
  durationSeconds: number;
  videoUrl: string;
  posterUrl: string;
  featured?: boolean;
  quote: string;
  sourceLineCount: number;
  packAuthors: readonly string[];
  roles: readonly { id: string; name: string; description: string; lineCount: number }[];
  modes: readonly { id: 'performance' | 'chaos'; title: string; description: string; eyebrow: string }[];
  script: readonly { id: string; startMs: number; endMs: number; text: string; direction: string }[];
};

type SceneProfile = Pick<DubScene, 'title' | 'sourceTitle' | 'genre' | 'category' | 'ageRating'>;

const profiles: Record<string, SceneProfile> = {
  'adam-sandler-encontra-turma-da-m': { title: 'Adam Sandler encontra a Turma da Mônica', sourceTitle: 'Pixels + Turma da Mônica', genre: 'Comédia', category: 'Memes', ageRating: '10' },
  'alanzoka-a-treta-do-bibsfirra': { title: "A treta do Bib'sfiha", sourceTitle: 'Alanzoka', genre: 'Humor', category: 'Memes', ageRating: '12' },
  'carros-mcqueen-e-mate-se-conhecendo-pt-br': { title: 'McQueen conhece Mate', sourceTitle: 'Carros', genre: 'Comédia', category: 'Animações', ageRating: 'L' },
  'carros-2006-cena-do-cinema-mack-pt-br': { title: 'Mack no cinema', sourceTitle: 'Carros', genre: 'Comédia', category: 'Animações', ageRating: 'L' },
  'celulas-interligadas': { title: 'Células interligadas', sourceTitle: 'Blade Runner 2049', genre: 'Ficção científica', category: 'Filmes', ageRating: '14' },
  'davy-jones-monster-de-cafe-pt-br': { title: 'Monster de café', sourceTitle: 'Davy Jones', genre: 'Humor', category: 'Memes', ageRating: '12' },
  'dilera-e-crazy-near-foguetinho-pt-br': { title: 'Foguetinho', sourceTitle: 'Dilera & Crazy Near', genre: 'Humor', category: 'Memes', ageRating: '14' },
  'documenta-rio-cadu-ta-dando-onda': { title: 'Cadu tá dando onda', sourceTitle: 'Tá Dando Onda', genre: 'Falso documentário', category: 'Animações', ageRating: '10' },
  'drake-kd-a-porta': { title: 'Cadê a porta?', sourceTitle: 'Drake & Josh', genre: 'Comédia', category: 'Séries', ageRating: '10' },
  'eduardo-marinho-prato-de-comida': { title: 'Prato de comida', sourceTitle: 'Eduardo Marinho', genre: 'Reflexão', category: 'Memes', ageRating: 'L' },
  'elfo-encantado': { title: 'Elfo encantado', sourceTitle: 'Cena viral', genre: 'Fantasia', category: 'Memes', ageRating: '12' },
  'escanor-vs-estarossa': { title: 'Escanor vs. Estarossa', sourceTitle: 'Nanatsu no Taizai', genre: 'Ação', category: 'Séries', ageRating: '14' },
  'eu-nao-estou-com-nenhum-diamante': { title: 'Sem nenhum diamante', sourceTitle: 'Minecraft', genre: 'Humor', category: 'Memes', ageRating: 'L' },
  'eu-sou-seu-pai': { title: 'Eu sou seu pai', sourceTitle: 'Star Wars', genre: 'Drama', category: 'Filmes', ageRating: '10' },
  'farquaad-e-biscoito': { title: 'Farquaad e Biscoito', sourceTitle: 'Shrek', genre: 'Comédia', category: 'Animações', ageRating: 'L' },
  'homem-aranha': { title: 'Homem-Aranha', sourceTitle: 'Homem-Aranha', genre: 'Ação', category: 'Filmes', ageRating: '12' },
  'homens-queimem-a-vila': { title: 'Queimem a vila!', sourceTitle: 'Cena viral', genre: 'Ação', category: 'Memes', ageRating: '16' },
  'jujutsu-kaisen': { title: 'Jujutsu Kaisen', sourceTitle: 'Jujutsu Kaisen', genre: 'Ação', category: 'Séries', ageRating: '14' },
  'kung-fu-panda-o-sigma-da-bahia': { title: 'Kung Fu Panda da Bahia', sourceTitle: 'Kung Fu Panda', genre: 'Humor', category: 'Memes', ageRating: '12' },
  'nossa-e-muito-forte': { title: 'Nossa, é muito forte', sourceTitle: 'Cena viral', genre: 'Humor', category: 'Memes', ageRating: '12' },
  'o-pequeno-principe-raposa-pt-br': { title: 'O Pequeno Príncipe e a Raposa', sourceTitle: 'O Pequeno Príncipe', genre: 'Drama', category: 'Animações', ageRating: 'L' },
  'o-segredo-dos-animais-pizza-pt-br': { title: 'A pizza', sourceTitle: 'O Segredo dos Animais', genre: 'Comédia', category: 'Animações', ageRating: 'L' },
  'one-piece': { title: 'One Piece', sourceTitle: 'One Piece', genre: 'Aventura', category: 'Séries', ageRating: '12' },
  'os-dois-ne': { title: 'Os dois, né?', sourceTitle: 'Cena viral', genre: 'Humor', category: 'Memes', ageRating: '12' },
  'palavra-cantada-rato-e-lua-pt-br': { title: 'Rato e Lua', sourceTitle: 'Palavra Cantada', genre: 'Musical', category: 'Animações', ageRating: 'L' },
  'palhaco-assustador-gumball': { title: 'Gumball assustador', sourceTitle: 'O Incrível Mundo de Gumball', genre: 'Comédia', category: 'Animações', ageRating: '10' },
  'plastico-filme': { title: 'Plástico-filme', sourceTitle: 'Cena viral', genre: 'Humor', category: 'Memes', ageRating: '12' },
  'psicopata-americano-patrick-mata-pau': { title: 'Patrick encontra Paul', sourceTitle: 'Psicopata Americano', genre: 'Suspense', category: 'Filmes', ageRating: '18' },
  'tokyo-revengers-pt-br': { title: 'Kazutora e Takemichi', sourceTitle: 'Tokyo Revengers', genre: 'Drama', category: 'Séries', ageRating: '14' },
  'um-pistoleiro-chamado-papaco-pt-br': { title: 'Ei, seu bunda-mole!', sourceTitle: 'Um Pistoleiro Chamado Papaco', genre: 'Comédia', category: 'Filmes', ageRating: '18' },
  'voce-e-um-brinquedo': { title: 'Você é um brinquedo', sourceTitle: 'Toy Story', genre: 'Drama', category: 'Animações', ageRating: 'L' },
  waveeee: { title: 'Waveeee', sourceTitle: 'Cena viral', genre: 'Humor', category: 'Memes', ageRating: '12' },
};

const modes: DubScene['modes'] = [
  { id: 'performance', title: 'Interpretação', description: 'Acompanhe o clima da cena e crie uma interpretação que encaixe no momento.', eyebrow: 'Modo cena' },
  { id: 'chaos', title: 'Modo caos', description: 'Ignore o original, improvise e transforme a cena em outra história.', eyebrow: 'Vale tudo' },
];

export const dubScenes: readonly DubScene[] = packCatalog.map((item) => {
  const profile = profiles[item.slug] ?? {
    title: item.packTitle,
    sourceTitle: 'BR DUB PACK',
    genre: 'Cena',
    category: 'Memes' as const,
    ageRating: '14',
  };
  return {
    id: item.slug,
    slug: item.slug,
    ...profile,
    description: `Assista à referência de ${profile.sourceTitle} e crie uma versão com a sua própria voz.`,
    durationSeconds: item.durationSeconds,
    videoUrl: item.videoUrl,
    posterUrl: item.posterUrl,
    featured: item.slug === 'palavra-cantada-rato-e-lua-pt-br',
    quote: 'Sua voz entra aqui.',
    sourceLineCount: item.sourceLineCount,
    packAuthors: item.authors,
    roles: [{ id: `${item.slug}-voice`, name: 'Voz livre', description: 'Você decide o personagem, o texto e a intenção.', lineCount: 1 }],
    modes,
    script: [{ id: `${item.slug}-take`, startMs: 0, endMs: item.durationSeconds * 1000, text: 'Dubla a cena do seu jeito.', direction: 'Observe o ritmo do vídeo e entre com a sua interpretação.' }],
  };
});

export function getScene(slug?: string) {
  return dubScenes.find((scene) => scene.slug === slug) ?? dubScenes[0];
}
