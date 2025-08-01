# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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