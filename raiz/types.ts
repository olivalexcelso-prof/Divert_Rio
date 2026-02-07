
export interface User {
  id: string;
  username: string;
  fullName?: string;
  whatsapp: string;
  cpf: string;
  balance: number;
  isAdmin: boolean;
  isFake?: boolean;
  bonusClaimed?: boolean;
  password?: string;
  referralCode: string;
  referredBy?: string;
  bonusSeriesCount: number; // Séries de bônus acumuladas para a próxima partida
  referralStats?: {
    totalInvited: number;
    totalEarnedSeries: number;
  };
}

export interface Card {
  id: string;
  userId: string;
  userName?: string;
  numbers: number[][]; // 3x9 grid
  marked: number[];
}

export enum GameStatus {
  SCHEDULED = 'SCHEDULED',
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}

export interface ScheduledGame {
  id: string;
  time: string; // HH:mm
  price: number;
  isManual: boolean;
  manualPrizes?: {
    quadra: number;
    linha: number;
    bingo: number;
  };
}

export interface AutoScheduleConfig {
  firstGameTime: string;
  intervalMinutes: number;
  seriesPrice: number;
  lastGameTime: string;
  isEnabled: boolean;
}

export interface GameState {
  status: GameStatus;
  drawnNumbers: number[];
  currentBall: number | null;
  prizes: {
    quadra: number;
    linha: number;
    bingo: number;
    acumulado: number;
  };
  // Added 'FINISHED' to the union to allow proper type checking when the prize sequence ends
  currentPrizeType: 'QUADRA' | 'LINHA' | 'BINGO' | 'ACUMULADO' | 'FINISHED';
  ballCount: number;
  nextGameTime: string | null;
  currentSeriesPrice: number;
  isManualCurrent?: boolean;
  lastWinner?: { 
    name: string; 
    prize: string;
    card?: Card; // Cartela vencedora para exibição real
  } | null;
  isEntryLocked: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'PURCHASE' | 'PRIZE' | 'BONUS' | 'REFERRAL';
  amount: number;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  date: string;
}
