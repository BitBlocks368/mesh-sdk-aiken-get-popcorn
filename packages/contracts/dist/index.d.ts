import { MeshWallet } from "@meshsdk/core";
import { GameTransaction } from "@get-popcorn/shared";
export declare class GameContracts {
    private wallet;
    constructor(wallet: MeshWallet);
    /**
     * Mint POPCORN tokens based on game score
     */
    mintGameRewards(finalScore: number): Promise<GameTransaction>;
    /**
     * Validate game session on-chain
     */
    validateGameSession(gameData: any): Promise<boolean>;
    /**
     * Query player's token balance
     */
    getTokenBalance(walletAddress: string): Promise<number>;
    /**
     * Get game leaderboard from blockchain
     */
    getLeaderboard(): Promise<any[]>;
}
export * from "@get-popcorn/shared";
