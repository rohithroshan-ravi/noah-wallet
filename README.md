# Noah Wallet (MetaMask Lite)

Production-ready EVM wallet Chrome extension using a side panel UI.

## Stack

- Extension frontend: React + TypeScript + Vite + TailwindCSS + Zustand + ethers
- Data provider: Moralis Web3 Data API (direct REST from extension)
- Surface: Chrome Extension Manifest V3 side panel

## Project Structure

```text
extension/
  manifest.json
  package.json
  tsconfig.json
  vite.config.ts
  postcss.config.cjs
  tailwind.config.ts
  .env.example
  src/
    background.ts
    content.ts
    inpage.ts
    shared/
      networks.ts
  sidepanel/
    index.html
    src/
      App.tsx
      main.tsx
      index.css
      types.ts
      components/
      pages/
      store/
        walletStore.ts
      utils/
        api.ts
        crypto.ts
        evm.ts
        storage.ts
```

## Security Notes

- Private keys are never sent to any backend.
- Vault data is encrypted in browser storage using AES-GCM + PBKDF2.
- Wallet unlock uses local password verification.
- Auto-lock clears unlocked key material from memory.

## Setup

```bash
cd extension
cp .env.example .env
npm install
npm run typecheck
npm run build
```

Set `VITE_MORALIS_API_KEY` in `.env` before build.

Load the unpacked extension from `extension/dist` in Chrome extension developer mode.

## Core Capabilities

- Create wallet (mnemonic)
- Import wallet (private key or seed phrase)
- Encrypted local vault
- Native and ERC20 balances via Moralis API
- Native/ERC20 send flows
- Transaction history
- Multi-network support with custom network support
- MV3 background service worker + content/inpage scripts
