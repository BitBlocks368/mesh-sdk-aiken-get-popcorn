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
    spawnedAt: number;
    state: "dormant" | "warming" | "jumping" | "ready" | "popped" | "falling";
    warmingAt?: number;
    jumpingAt?: number;
    readyAt?: number;
    originalX: number;
    originalY: number;
    settledX?: number;
    settledY?: number;
    velocityX?: number;
    velocityY?: number;
    gravity?: number;
    settled?: boolean;
    bounceCount: number;
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
export interface BlockchainGameState extends GameState {
    walletConnected: boolean;
    walletAddress?: string;
    pendingTx?: string;
    tokenBalance: number;
}
export interface GameTransaction {
    txHash: string;
    gameScore: number;
    tokensEarned: number;
    timestamp: number;
    status: 'pending' | 'confirmed' | 'failed';
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
    position: {
        x: number;
        y: number;
    };
    points: number;
}
