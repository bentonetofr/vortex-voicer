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
  { id: 'demo-1', name: 'Marina Alves', initials: 'MA', mode: 'performance', caption: 'Tentei segurar a emoção até a última fala.', reactions: 184, time: 'há 8 min', color: 'violet', isDemo: true },
  { id: 'demo-2', name: 'Lucas Nogueira', initials: 'LN', mode: 'chaos', caption: 'A transmissão virou atendimento de telemarketing.', reactions: 327, time: 'há 14 min', color: 'blue', isDemo: true },
  { id: 'demo-3', name: 'Joana Reis', initials: 'JR', mode: 'performance', caption: 'Primeira vez dublando. Gostei mais do que esperava.', reactions: 96, time: 'há 21 min', color: 'rose', isDemo: true },
  { id: 'demo-4', name: 'Caio Melo', initials: 'CM', mode: 'chaos', caption: 'Definitivamente não era a voz que estava no roteiro.', reactions: 241, time: 'há 29 min', color: 'amber', isDemo: true },
  { id: 'demo-5', name: 'Bia Torres', initials: 'BT', mode: 'performance', caption: 'Três tentativas até acertar o sussurro.', reactions: 133, time: 'há 37 min', color: 'mint', isDemo: true },
];
