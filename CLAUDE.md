# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CURRENT DEVELOPMENT STATUS

**COMPLETED:** Stages 1-2 - Workspace setup, dependency unification, Aiken & Yaci installation
**READY FOR:** Stage 3 - CIP-68 Token System Implementation  
**LAST SESSION:** Designed complete CIP-68 BUCKET + POPCORN token architecture

## 🎯 NEXT IMPLEMENTATION: CIP-68 Token System

### Implementation Priority: Stage 3
**Duration:** 4-6 hours  
**Risk Level:** High  
**Dependencies:** Aiken v1.1.19, MeshSDK 1.8.x, Yaci DevKit ready

## 🪣 CIP-68 TOKEN SYSTEM DESIGN

### Token Architecture Overview
The game implements a **two-token reward system** using CIP-68 standard:

1. **BUCKET NFT** (CIP-68 Compliant)
   - **Type:** Non-Fungible Token (0 decimals)
   - **Purpose:** Track player game statistics and progression  
   - **Upgradeability:** Metadata updates with each new game played
   - **Structure:** Reference NFT (label 100) + User NFT (label 222)

2. **POPCORN Token** (Fungible) 
   - **Type:** Fungible Token (6 decimals, format: 1.000000)
   - **Purpose:** Reward currency earned by collecting kernels
   - **Reward:** Whole kernels collected + random decimal bonus (0.000001-0.999999)

### First-Time Player Flow
```
New Player → Complete First Game → Mint Both Tokens
├── BUCKET NFT: Records first game stats forever + upgrades with future games
└── POPCORN: Kernels collected (15) + random bonus (0.123456) = 15.123456 POPCORN
```

### CIP-68 BUCKET NFT Structure

#### Token Naming Convention
```
Policy ID: <single_policy_for_both_tokens>
├── Reference NFT: (100)<player_address_hash>_bucket
├── User NFT:      (222)<player_address_hash>_bucket  
└── POPCORN:       (333)popcorn
```

#### Metadata Schema (Stored in Reference NFT Datum)
```aiken
pub type BucketMetadata {
  // Core identification
  name: ByteArray,                    // "Popcorn Bucket #001"
  description: ByteArray,             // "A collection bucket for popcorn game stats"
  image: ByteArray,                   // IPFS hash or data URL
  
  // Game statistics (updatable)
  total_games_played: Int,            // Lifetime games
  total_kernels_collected: Int,       // Lifetime kernels
  total_popcorn_earned: Int,          // Total POPCORN tokens (in smallest unit)
  highest_score: Int,                 // Personal best score
  longest_streak: Int,                // Personal best streak
  total_playtime_seconds: Int,        // Lifetime playtime
  
  // First game stats (immutable memorial)
  first_game: GameResult,
  
  // Recent performance
  last_10_games: List<GameResult>,    // Recent game history
  
  // Achievement flags
  achievements_unlocked: List<ByteArray>,
  
  // Rarity/Special attributes  
  bucket_tier: BucketTier,            // Bronze/Silver/Gold/Diamond
  special_traits: List<ByteArray>,    // Special unlocked traits
}

pub type GameResult {
  timestamp: POSIXTime,
  score: Int,
  kernels: Int,
  streak: Int,
  duration_seconds: Int,
}

pub type BucketTier {
  Bronze    // 0-999 lifetime kernels
  Silver    // 1000-4999 lifetime kernels  
  Gold      // 5000+ lifetime kernels
  Diamond   // Special achievements
}

pub type BucketDatum {
  metadata: BucketMetadata,
  version: Int,                       // Increments with each update
  extra: Data,                        // Reserved for future use
}
```

### Smart Contract Implementation Plan

#### Files to Create/Modify:

1. **`aiken-workspace/validators/bucket_mint.ak`** (NEW)
   - First-time player minting policy
   - Validates first game completion
   - Mints both BUCKET NFT (CIP-68) and POPCORN tokens
   - Creates initial bucket metadata

2. **`aiken-workspace/validators/bucket_upgrade.ak`** (NEW)  
   - Spending validator for bucket NFT updates
   - Updates metadata after each subsequent game
   - Validates game results and calculates new stats

3. **`aiken-workspace/validators/mint.ak`** (REPLACE)
   - Current always-succeed policy → game-specific logic
   - Handle both first-time and upgrade scenarios

4. **`packages/shared/src/index.ts`** (EXTEND)
   - Add CIP-68 types and interfaces
   - Define BucketMetadata and GameResult types

5. **`packages/contracts/src/bucket-contracts.ts`** (NEW)
   - MeshJS integration for bucket operations
   - First-time minting functions  
   - Bucket upgrade functions
   - Metadata parsing utilities

### Implementation Steps

#### Step 1: Update Smart Contracts
```bash
# Replace simple mint policy with CIP-68 bucket system
cd aiken-workspace/validators/
# Create bucket_mint.ak, bucket_upgrade.ak
# Update mint.ak with game-specific logic
npm run aiken  # Test new contracts
```

#### Step 2: Add MeshSDK to Game Package
```bash
cd packages/game/
npm install @meshsdk/core@^1.8 @meshsdk/react@^1.8
```

#### Step 3: Create Contract Integration Layer
```bash
# Implement packages/contracts/src/bucket-contracts.ts
# Add CIP-68 reference token utilities
# Create minting transaction builders
```

#### Step 4: Integrate with Game Frontend
```bash  
# Add wallet connection to game
# Track game session data
# Mint tokens on first game completion
# Update bucket on subsequent games
```

### Anti-Cheat & Validation Strategy

#### Multi-Layer Validation:
1. **Client-Side** (UX): Real-time validation feedback
2. **Smart Contract** (Security): Final authority validation
3. **CIP-68 Metadata** (Auditability): All stats recorded on-chain

#### Validation Rules:
- **First-Game Check:** Player must not have existing bucket NFT
- **Stats Validation:** Game results must be mathematically possible
- **Time Bounds:** Game duration 50-70 seconds
- **Signature Required:** Player wallet must sign transaction
- **Unique Sessions:** Prevent replay attacks with nonces

### Reward Calculation Examples

| Game Performance | Kernels | Score | POPCORN Base | Random Bonus | Final POPCORN |
|------------------|---------|-------|--------------|--------------|---------------|
| Beginner | 8 | 120 | 8.000000 | +0.234567 | **8.234567** |
| Average | 20 | 350 | 20.000000 | +0.789123 | **20.789123** |
| Expert | 35 | 650 | 35.000000 | +0.456789 | **35.456789** |

### Bucket NFT Tier Progression

| Tier | Lifetime Kernels | Bucket Image | Special Traits |
|------|------------------|--------------|----------------|
| 🥉 Bronze | 0-999 | bronze_bucket.png | "First Steps" |
| 🥈 Silver | 1,000-4,999 | silver_bucket.png | "Kernel Collector" |
| 🥇 Gold | 5,000-9,999 | gold_bucket.png | "Popcorn Master" |
| 💎 Diamond | 10,000+ | diamond_bucket.png | "Legendary Popper" |

## Project Overview

This is a Cardano smart contract development template that combines:
- **Aiken**: Smart contract language for Cardano (PlutusV3)
- **MeshJS**: TypeScript SDK for Cardano blockchain interactions
- **Yaci DevKit**: Local Cardano devnet for testing

The project demonstrates three types of Plutus validators:
- **Minting Policy** (`mint.ak`): Always succeeds minting policy
- **Spending Validator** (`spend.ak`): "Hello World" validator requiring specific message and signature
- **Withdrawal/Staking Validator** (`withdraw.ak`): Always succeeds withdrawal/certificate validator

## Development Commands

### Prerequisites
Aiken must be installed for smart contract development:
```bash
# Install Aiken (one-time setup)
curl -sSfL https://install.aiken-lang.org | sh
source $HOME/.aiken/bin/env
aikup  # Install latest Aiken version

# Add to your shell profile for permanent PATH access:
echo 'source $HOME/.aiken/bin/env' >> ~/.zshrc  # or ~/.bashrc
```

### Smart Contract Development
```bash
# Build and check Aiken smart contracts
npm run aiken

# Individual Aiken commands (run from aiken-workspace/)
cd aiken-workspace
aiken check           # Run tests
aiken build           # Compile contracts
aiken check -m foo    # Run tests matching "foo"
aiken docs            # Generate documentation
```

### Workspace Commands
```bash
# Game development
npm run dev:game        # Start React game on http://localhost:5173
npm run build:game      # Build game for production

# Contract development  
npm run dev:contracts   # Run mesh contract tests
npm run build:contracts # Build contract interaction layer

# Workspace management
npm run build:all       # Build all packages
npm run build:shared    # Build shared types package
npm install            # Install all workspace dependencies
```

### Local Devnet Setup

#### Prerequisites
Install Yaci DevKit and Viewer:
```bash
# Install Yaci DevKit and Viewer globally
npm install -g @bloxbean/yaci-devkit
npm install -g @bloxbean/yaci-viewer
```

#### Starting the Devnet
```bash
# Start local Cardano devnet with required components
yaci-devkit up --enable-yaci-store --interactive

# First run will download Cardano node binaries (~150MB)
# Wait for "DevNet is ready" message before proceeding

# Optional: Start blockchain explorer in another terminal
yaci-viewer
```

#### Devnet Endpoints
Once running, these endpoints are available:
- **Cardano Node API:** http://localhost:8080/api/v1
- **Admin API:** http://localhost:10000  
- **Yaci Store API:** http://localhost:8080/api/v1/stores
- **Yaci Viewer:** http://localhost:3001 (if started)

#### Devnet Management
```bash
# In the Yaci DevKit shell:
start          # Start the devnet
stop           # Stop the devnet  
reset          # Reset devnet data
info           # Show devnet information
topup <addr>   # Fund an address with test ADA
```

## Architecture

### Directory Structure
- `aiken-workspace/`: Aiken smart contracts
  - `validators/`: Smart contract validators (.ak files)
  - `aiken.toml`: Aiken project configuration
  - `plutus.json`: Compiled contract artifacts
- `mesh/`: TypeScript integration layer
  - `common.ts`: Wallet and provider utilities
  - `transactions/tx.ts`: Contract interaction logic
  - `index.ts`: Test execution entry point

### Smart Contract Architecture
The project uses PlutusV3 validators with these patterns:
- **Parameterized validators**: `withdraw.ak` takes owner verification key hash as parameter
- **Inline datums**: Spending validator uses inline datum with owner information
- **Multi-purpose validators**: Each validator handles specific script purposes (mint/spend/withdraw/publish)

### TypeScript Integration
- **Provider**: `MeshYaciProvider` extends `YaciProvider` for local devnet interaction
- **Wallet Management**: `newWallet()` creates HD wallets with mnemonic phrases
- **Transaction Building**: `MeshContractTx` class encapsulates all contract interactions
- **Script Compilation**: Uses `plutus.json` for compiled contract code and applies CBOR encoding

### Test Flow
The `mesh/index.ts` orchestrates a complete test sequence:
1. **Setup**: Fund wallet, prepare UTxOs, register stake certificate
2. **Mint**: Test minting policy validator
3. **Spend**: Test spending validator with "Hello, World!" message  
4. **Withdraw**: Test withdrawal from stake reward address
5. **Publish**: Test stake certificate deregistration

## Environment Configuration

### Environment Variables
- `YACI_BASE_URL`: Yaci API endpoint (default: http://localhost:8080)
- `YACI_ADMIN_URL`: Yaci admin endpoint (default: http://localhost:10000)

### Dependencies
- `@meshsdk/core`: Core MeshJS blockchain utilities
- `@meshsdk/core-csl`: Cardano serialization library bindings
- `tsx`: TypeScript execution runtime
- `axios`: HTTP client for API requests

## Working with Smart Contracts

### Aiken Contract Dependencies
- `aiken-lang/stdlib@v2.2.0`: Standard library
- `sidan-lab/vodka@0.1.14`: Testing utilities (mocktail framework)

### Contract Testing Patterns
- Use `mocktail` framework for unit testing
- Mock transaction builders with `mocktail_tx()`
- Test both success and failure scenarios
- Parameterize tests with mock data

### TypeScript Contract Integration
- Import compiled code from `plutus.json`
- Apply parameters using `applyParamsToScript()`
- Handle script hashing with `resolveScriptHash()`
- Use inline datums with `txOutInlineDatumValue()`

## 🔧 CRITICAL IMPLEMENTATION DETAILS

### CIP-68 Reference Token Implementation

#### Smart Contract Validation Logic
```aiken
// bucket_mint.ak - First-time player minting
validator bucket_mint_policy {
  mint(redeemer: FirstGameRedeemer, policy_id: PolicyId, tx: Transaction) {
    let FirstGameRedeemer { player, game_stats, popcorn_amount, popcorn_bonus } = redeemer
    
    // 1. Validate first-time player (no existing bucket)
    let no_existing_bucket = !player_has_bucket(player, tx.reference_inputs)
    
    // 2. Validate game stats are reasonable
    let valid_duration = game_stats.duration_seconds >= 50 && game_stats.duration_seconds <= 70
    let valid_score = game_stats.score >= game_stats.kernels * 10  // Min 10 points per kernel
    let valid_kernels = game_stats.kernels >= 1 && game_stats.kernels <= 100
    
    // 3. Validate POPCORN reward calculation
    let expected_base = game_stats.kernels * 1_000_000  // 6 decimals
    let valid_bonus = popcorn_bonus >= 0 && popcorn_bonus <= 999_999
    let valid_popcorn = popcorn_amount == expected_base + popcorn_bonus
    
    // 4. Validate minted tokens (CIP-68 pattern)
    let reference_nft_minted = check_token_minted(tx, policy_id, build_reference_name(player), 1)
    let user_nft_minted = check_token_minted(tx, policy_id, build_user_name(player), 1)  
    let popcorn_minted = check_token_minted(tx, policy_id, "popcorn", popcorn_amount)
    
    // 5. Validate reference NFT datum contains correct metadata
    let metadata_valid = validate_initial_bucket_metadata(tx, player, game_stats, popcorn_amount)
    
    no_existing_bucket && valid_duration && valid_score && valid_kernels && 
    valid_popcorn && reference_nft_minted && user_nft_minted && popcorn_minted && metadata_valid
  }
}

// Helper functions for CIP-68 naming
fn build_reference_name(player: VerificationKeyHash) -> ByteArray {
  #"000643b0" <> blake2b_256(player) <> #"5f6275636b6574"  // (100) + hash + "_bucket"
}

fn build_user_name(player: VerificationKeyHash) -> ByteArray {
  #"000de140" <> blake2b_256(player) <> #"5f6275636b6574"  // (222) + hash + "_bucket"
}
```

#### MeshJS Integration Example
```typescript
// packages/contracts/src/bucket-contracts.ts

import { MeshWallet, MeshTxBuilder, applyCborEncoding, resolveScriptHash } from "@meshsdk/core";
import { BucketMetadata, GameResult } from "@get-popcorn/shared";
import blueprint from "../../../aiken-workspace/plutus.json";

export class BucketContracts {
  private wallet: MeshWallet;
  private policyId: string;

  constructor(wallet: MeshWallet) {
    this.wallet = wallet;
    // Get policy ID from compiled script
    const scriptCbor = applyCborEncoding(blueprint.validators[0].compiledCode);
    this.policyId = resolveScriptHash(scriptCbor, "V3");
  }

  /**
   * Mint first BUCKET NFT + POPCORN tokens for new player
   */
  async mintFirstBucket(gameResult: GameResult): Promise<string> {
    const playerAddress = (await this.wallet.getUsedAddresses())[0];
    const playerHash = this.getAddressHash(playerAddress);
    
    // Calculate POPCORN reward (kernels + random bonus)
    const popcornBase = gameResult.kernels * 1_000_000; // 6 decimals
    const popcornBonus = Math.floor(Math.random() * 999_999); // 0-999999 microunits
    const totalPopcorn = popcornBase + popcornBonus;

    // Build CIP-68 token names
    const referenceTokenName = this.buildReferenceTokenName(playerHash);
    const userTokenName = this.buildUserTokenName(playerHash);
    const popcornTokenName = "popcorn";

    // Create initial bucket metadata
    const metadata: BucketMetadata = {
      name: `Popcorn Bucket #${this.formatPlayerId(playerHash)}`,
      description: "A magical bucket that grows with each popcorn game!",
      image: this.getBucketImageUrl("bronze"),
      total_games_played: 1,
      total_kernels_collected: gameResult.kernels,
      total_popcorn_earned: totalPopcorn,
      highest_score: gameResult.score,
      longest_streak: gameResult.streak,
      total_playtime_seconds: gameResult.duration_seconds,
      first_game: gameResult,
      last_10_games: [gameResult],
      achievements_unlocked: [],
      bucket_tier: "Bronze",
      special_traits: [],
    };

    // Build minting transaction
    const txBuilder = new MeshTxBuilder({
      fetcher: this.wallet.fetcher,
      evaluator: this.wallet.evaluator,
    });

    const mintingRedeemer = {
      player: playerHash,
      game_stats: gameResult,
      popcorn_amount: totalPopcorn,
      popcorn_bonus: popcornBonus,
    };

    const tx = await txBuilder
      .mintPlutusScriptV3()
      .mint("1", this.policyId, referenceTokenName)
      .mint("1", this.policyId, userTokenName)
      .mint(totalPopcorn.toString(), this.policyId, popcornTokenName)
      .mintingScript(this.getScriptCbor())
      .mintRedeemerValue(mintingRedeemer)
      // Reference NFT output with metadata datum
      .txOut(playerAddress, [
        { unit: this.policyId + referenceTokenName, quantity: "1" }
      ])
      .txOutInlineDatumValue({
        metadata: metadata,
        version: 1,
        extra: null
      })
      // User NFT output to player
      .txOut(playerAddress, [
        { unit: this.policyId + userTokenName, quantity: "1" },
        { unit: this.policyId + popcornTokenName, quantity: totalPopcorn.toString() }
      ])
      .changeAddress(playerAddress)
      .complete();

    return tx;
  }

  private buildReferenceTokenName(playerHash: string): string {
    return "000643b0" + playerHash + "5f6275636b6574"; // (100) + hash + "_bucket"
  }

  private buildUserTokenName(playerHash: string): string {
    return "000de140" + playerHash + "5f6275636b6574"; // (222) + hash + "_bucket"  
  }

  private getAddressHash(address: string): string {
    // Extract pubkey hash from address for token naming
    // Implementation depends on address format
    return "placeholder_hash"; // TODO: Implement proper hash extraction
  }
}
```

### Frontend Integration Points

#### Game Session Tracking
```typescript
// packages/game/src/hooks/useGameSession.ts

export interface GameSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  finalScore: number;
  kernelsPopped: number;
  maxStreak: number;
  duration: number;
  playerAddress?: string;
}

export const useGameSession = () => {
  const [session, setSession] = useState<GameSession | null>(null);
  const [isFirstTimePlayer, setIsFirstTimePlayer] = useState<boolean | null>(null);

  const startSession = async (walletAddress: string) => {
    // Check if player has existing bucket NFT
    const hasExistingBucket = await checkPlayerBucket(walletAddress);
    setIsFirstTimePlayer(!hasExistingBucket);

    const newSession: GameSession = {
      sessionId: crypto.randomUUID(),
      startTime: Date.now(),
      playerAddress: walletAddress,
      finalScore: 0,
      kernelsPopped: 0,
      maxStreak: 0,
      duration: 0,
    };
    setSession(newSession);
  };

  const endSession = (finalStats: Omit<GameSession, 'sessionId' | 'startTime' | 'playerAddress'>) => {
    if (!session) return null;
    
    const completedSession = {
      ...session,
      ...finalStats,
      endTime: Date.now(),
      duration: Math.floor((Date.now() - session.startTime) / 1000),
    };
    setSession(completedSession);
    return completedSession;
  };

  return { session, isFirstTimePlayer, startSession, endSession };
};
```

#### Wallet Integration in Game
```typescript
// packages/game/src/components/PopcornGame.tsx - Key additions

import { useWallet } from "@meshsdk/react";
import { BucketContracts } from "@get-popcorn/contracts";
import { useGameSession } from "../hooks/useGameSession";

// Add to PopcornGame component:
const { connected, wallet, connect, disconnect } = useWallet();
const { session, isFirstTimePlayer, startSession, endSession } = useGameSession();
const [bucketContracts, setBucketContracts] = useState<BucketContracts | null>(null);

// Initialize contracts when wallet connects
useEffect(() => {
  if (connected && wallet) {
    setBucketContracts(new BucketContracts(wallet));
  }
}, [connected, wallet]);

// Modified startGame function
const startGame = async () => {
  if (!connected) {
    await connect();
    return;
  }

  const address = (await wallet.getUsedAddresses())[0];
  await startSession(address);

  setGameState((prev) => ({
    ...prev,
    gameActive: true,
    popcornCount: 0,
    score: 0,
    timeRemaining: GAME_DURATION,
  }));

  // ... rest of existing game start logic
};

// Modified endGame function  
const endGame = async () => {
  const finalSession = endSession({
    finalScore: gameState.score,
    kernelsPopped: gameState.popcornCount,
    maxStreak: gameStats.maxStreak,
    endTime: Date.now(),
    duration: GAME_DURATION - gameState.timeRemaining,
  });

  if (finalSession && bucketContracts && isFirstTimePlayer) {
    try {
      // Mint first bucket + POPCORN tokens
      const gameResult = {
        timestamp: finalSession.endTime!,
        score: finalSession.finalScore,
        kernels: finalSession.kernelsPopped,
        streak: finalSession.maxStreak,
        duration_seconds: finalSession.duration,
      };
      
      const txHex = await bucketContracts.mintFirstBucket(gameResult);
      const signedTx = await wallet.signTx(txHex);
      const txHash = await wallet.submitTx(signedTx);
      
      console.log("Tokens minted! Transaction:", txHash);
    } catch (error) {
      console.error("Failed to mint tokens:", error);
    }
  }

  setGameState((prev) => ({ ...prev, gameActive: false }));
  // ... rest of existing game end logic
};
```

### Testing Strategy

#### Unit Tests (Aiken)
```bash
cd aiken-workspace
aiken check -m bucket  # Test bucket-related validators
aiken check -m mint    # Test minting logic
aiken check -m upgrade # Test upgrade logic
```

#### Integration Tests (MeshJS)
```bash
npm run dev:contracts  # Test with local Yaci devnet
```

#### Manual Testing Flow
1. Start Yaci devnet: `yaci-devkit up --enable-yaci-store --interactive`
2. Start game: `npm run dev:game`
3. Connect wallet, play first game
4. Verify tokens minted on Yaci Explorer
5. Play second game, verify bucket updates

### Common Issues & Solutions

#### CIP-68 Token Name Generation
- **Problem:** Incorrect label prefixes or hash calculation
- **Solution:** Use exact CIP-67 label format: (100), (222), (333)
- **Verify:** Check token names match reference/user pattern exactly

#### Metadata Datum Structure  
- **Problem:** Incorrect CBOR encoding of metadata
- **Solution:** Follow exact datum format: [metadata, version, extra]
- **Verify:** Use CBOR.me to validate datum structure

#### Transaction Building
- **Problem:** Missing reference NFT output or incorrect datum
- **Solution:** Ensure reference NFT goes to separate output with inline datum
- **Verify:** Transaction must have both reference NFT + user NFT outputs

### Next Session Priorities

1. **START HERE:** Implement `bucket_mint.ak` validator in Aiken
2. **THEN:** Create `BucketContracts` class in TypeScript  
3. **THEN:** Add wallet connection to game frontend
4. **FINALLY:** Test complete flow on Yaci devnet

**⚠️ CRITICAL:** Test CIP-68 token naming and metadata structure thoroughly before frontend integration!

## 📋 SESSION HANDOFF SUMMARY

### What Was Accomplished This Session:
✅ **Stage 1-2 Complete:** Clean workspace architecture with unified dependencies  
✅ **Environment Setup:** Aiken v1.1.19 + Yaci DevKit + MeshSDK 1.8.x installed  
✅ **Game Analysis:** Comprehensive analysis of scoring system and mechanics  
✅ **CIP-68 Design:** Complete token architecture for BUCKET NFT + POPCORN system  
✅ **Smart Contract Planning:** Detailed validator logic and validation rules  
✅ **Integration Strategy:** Frontend/backend integration points mapped out  

### Current State:
- **Game:** Working perfectly at `npm run dev:game` (http://localhost:5173)  
- **Smart Contracts:** Template contracts ready, need CIP-68 implementation  
- **Workspace:** Clean npm workspace with proper package structure  
- **Documentation:** Complete implementation roadmap in this file  

### Immediate Next Steps (Stage 3):
1. **Create `aiken-workspace/validators/bucket_mint.ak`** - CIP-68 minting policy
2. **Add MeshSDK to game package** - `npm install @meshsdk/core@^1.8 @meshsdk/react@^1.8`  
3. **Implement `packages/contracts/src/bucket-contracts.ts`** - Contract interaction layer
4. **Add wallet connection to game** - Integration with existing game flow

### Key Design Decisions Made:
- **CIP-68 Standard:** BUCKET NFT uses reference token pattern for upgradeable metadata
- **Two-Token System:** BUCKET (stats tracker) + POPCORN (fungible reward)
- **First-Time Flow:** New players get both tokens after first game completion
- **Reward Formula:** 1:1 kernels + random decimal bonus (0.000001-0.999999)
- **Validation Strategy:** Multi-layer (client + smart contract + metadata audit trail)

### Critical Implementation Notes:
- **Token Naming:** Follow exact CIP-67 label format (100), (222), (333)
- **Metadata Structure:** [metadata, version, extra] in reference NFT datum
- **Transaction Pattern:** Separate outputs for reference NFT vs user NFT
- **Anti-Cheat:** Time bounds, stats validation, first-player checks

### Files Ready for Implementation:
- ✅ `packages/shared/src/index.ts` - Has basic types, needs CIP-68 types added
- ✅ `packages/contracts/package.json` - Ready for MeshSDK integration  
- ✅ `packages/game/src/components/PopcornGame.tsx` - Game mechanics working
- 🟡 `aiken-workspace/validators/` - Needs new bucket validators
- 🟡 `packages/contracts/src/` - Needs contract implementation

### Testing Environment Ready:
- Yaci DevKit: `yaci-devkit up --enable-yaci-store --interactive`
- Game Server: `npm run dev:game`
- Contract Tests: `npm run aiken` + `npm run dev:contracts`
- Explorer: `yaci-viewer` (optional)

**🎯 GOAL FOR NEXT SESSION:** Complete Stage 3 - working CIP-68 token minting after first game!

---

*Last updated: Session ending with comprehensive CIP-68 token system design complete*