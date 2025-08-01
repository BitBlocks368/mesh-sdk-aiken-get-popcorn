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

### TypeScript Testing
```bash
# Run the complete test suite against local devnet
npm run dev

# Install dependencies
npm install
```

### Local Devnet Setup
```bash
# Install Yaci DevKit globally
npm install -g @bloxbean/yaci-devkit

# Start local Cardano devnet
yaci-devkit up --enable-yaci-store --interactive

# Optional: Start block explorer
yaci-viewer
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