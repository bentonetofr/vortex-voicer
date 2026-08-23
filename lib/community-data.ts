export type CommunitySubmission = {
  id: string;
  name: string;
  initials: string;
  mode: 'performance' | 'chaos';
  caption: string;
  reactions: number;
  time: string;
  color: string;
  audioUrl?: string;
  isDemo?: boolean;
};

export const demoSubmissions: CommunitySubmission[] = [
  { id: 'demo-1', name: 'Marina Alves', initials: 'MA', mode: 'performance', caption: 'Tentei encontrar o ritmo certo em cada frase.', reactions: 184, time: 'exemplo', color: 'violet', isDemo: true },
  { id: 'demo-2', name: 'Lucas Nogueira', initials: 'LN', mode: 'chaos', caption: 'Troquei o roteiro inteiro e a cena virou outra coisa.', reactions: 327, time: 'exemplo', color: 'blue', isDemo: true },
  { id: 'demo-3', name: 'Joana Reis', initials: 'JR', mode: 'performance', caption: 'Primeira vez dublando. Gostei mais do que esperava.', reactions: 96, time: 'exemplo', color: 'rose', isDemo: true },
  { id: 'demo-4', name: 'Caio Melo', initials: 'CM', mode: 'chaos', caption: 'Definitivamente não era a voz que estava no roteiro.', reactions: 241, time: 'exemplo', color: 'amber', isDemo: true },
  { id: 'demo-5', name: 'Bia Torres', initials: 'BT', mode: 'performance', caption: 'Algumas tentativas até acertar a intenção.', reactions: 133, time: 'exemplo', color: 'mint', isDemo: true },
];
