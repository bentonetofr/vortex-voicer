export type GameRoomState = {
  room: {
    code: string;
    mode: string;
    status: 'lobby' | 'starting' | 'playing' | 'playback' | 'finished';
    currentRound: number;
    totalRounds: number;
    maxPlayers: number;
  };
  me: { id: string; displayName: string; isHost: boolean; seat: number };
  players: Array<{ id: string; displayName: string; seat: number; submitted: boolean }>;
  round: {
    id: string;
    number: number;
    status: string;
    scene: {
      slug: string;
      title: string;
      sourceTitle: string;
      description: string;
      durationSeconds: number;
      videoUrl: string;
      posterUrl: string;
      ageRating: string;
      genre: string;
    };
  } | null;
  submissions: Array<{
    id: string;
    userId: string;
    displayName: string;
    seat: number;
    audioUrl: string;
  }>;
};
