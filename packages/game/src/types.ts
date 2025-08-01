export interface GameState {
  gameActive: boolean;
  popcornCount: number;
  level: number;
  score: number;
  timeRemaining: number;
}

export interface PopcornKernelType {
  id: string;
  x: number;
  y: number;
  isPopped: boolean;
  poppedAt?: number;
}

export interface GameStats {
  totalPopped: number;
  accuracy: number;
  streak: number;
  maxStreak: number;
}

export interface Player {
  id: string;
  name: string;
  walletAddress?: string;
  score: number;
  level: number;
}

export interface WebSocketMessage {
  type: 'game_update' | 'player_action' | 'broadcast' | 'connect' | 'disconnect';
  playerId?: string;
  data: any;
  timestamp: number;
}

export interface PopcornAction {
  type: 'pop' | 'miss' | 'combo';
  kernelId: string;
  position: { x: number; y: number };
  points: number;
}

export interface CardanoTransaction {
  txHash: string;
  amount: number;
  asset: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: number;
}