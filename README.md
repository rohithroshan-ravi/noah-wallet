# Noah Wallet (MetaMask Lite)

Production-style EVM wallet browser extension + backend API.

## Stack

- Frontend extension: React + TypeScript + Vite + TailwindCSS + Zustand + ethers
- Backend API: Node.js + Express + MongoDB + Moralis + JWT
- Auth: Sign-In with Ethereum (SIWE)

## Project Structure

```text
extension/
  manifest.json
  package.json
  tsconfig.json
  vite.config.ts
  postcss.config.cjs
  tailwind.config.ts
  src/
    background.ts
    content.ts
    inpage.ts
    shared/
      networks.ts
  popup/
    index.html
    src/
      App.tsx
      main.tsx
      index.css
      types.ts
      components/
        AuthGate.tsx
        Dashboard.tsx
        NetworkSelector.tsx
        SendForm.tsx
        RecentTransactions.tsx
      hooks/
        useAutoLock.ts
      store/
        walletStore.ts
      utils/
        api.ts
        crypto.ts
        evm.ts
        storage.ts

server/
  .env.example
  package.json
  src/
    index.js
    app.js
    config/
      env.js
      mongo.js
      moralis.js
    models/
      User.js
    middleware/
      auth.js
    controllers/
      authController.js
      walletController.js
      marketController.js
    routes/
      authRoutes.js
      walletRoutes.js
      marketRoutes.js
```

## Security Notes

- Private keys are never sent to backend.
- Private keys are encrypted in extension local storage using AES-GCM + PBKDF2.
- Wallet is protected by password unlock.
- Auto-lock inactivity timer clears unlocked key from memory.
- Backend stores only user metadata (address, preferences, nonce).

## Run Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

## Run Extension Build

```bash
cd extension
cp .env.example .env
npm install
npm run build
```

Load extension from: `extension/dist` in Chromium browser extension developer mode.

## Core Capabilities Included

- Create wallet (mnemonic generation)
- Import wallet (private key / seed phrase)
- Encrypted vault in browser storage
- Native and ERC20 balance retrieval (via backend Moralis)
- Native token sending + gas estimation
- Transaction history list
- Networks: Ethereum, Polygon, BSC + custom network support
- Manifest v3 with background service worker, content script, and inpage provider injection
- Dark mode + QR code + copy address
