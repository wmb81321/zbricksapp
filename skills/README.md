# ZKBricks Web3 Skills Library

Extracted implementation patterns from the ZKBricks auction platform. Use these as reference when building new Web3 apps with AI assistance.

## Skills Index

| # | Skill | What It Covers |
|---|-------|---------------|
| 01 | **[Metadata Builders](./01-metadata-builders.md)** | Zod validation, IPFS upload (Pinata), progressive NFT metadata, drag-and-drop images, dynamic attributes |
| 02 | **[Contract Interactions](./02-contract-interactions-ethers.md)** | ethers.js v6, contract factories, read/write functions, event queries, USDC utilities, barrel exports |
| 03 | **[Circle Programmable Wallets](./03-circle-programmable-wallets.md)** | Social login (Google OAuth), SDK initialization, wallet creation, custom signer bridge, credential persistence |
| 04 | **[React Web3 Hooks](./04-react-web3-hooks.md)** | Auto-refresh hooks, event subscriptions, countdown timers, wallet credentials, parallel data loading |
| 05 | **[Two-Step Transaction](./05-two-step-transaction-pattern.md)** | ERC-20 approve + execute, step progress UI, allowance checks, currency input formatting |
| 06 | **[Cross-Chain Gateway](./06-cross-chain-gateway-eip712.md)** | Circle Gateway, EIP-712 typed data, burn intents, hex utilities, multi-chain config |
| 07 | **[Next.js API Proxy](./07-nextjs-web3-api-proxy.md)** | Action-based API routes, server-side key protection, idempotency, header forwarding |
| 08 | **[Web3 Component Patterns](./08-web3-component-patterns.md)** | Auction display, admin auth, address formatting, phase progress, bid history, dark theme |

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Blockchain**: ethers.js v6 on Base Sepolia
- **Wallets**: Circle Programmable Wallets (no MetaMask required for users)
- **Storage**: Pinata IPFS (images + JSON metadata)
- **Validation**: Zod schemas
- **Styling**: Tailwind CSS 4
- **Auth**: Google OAuth via Circle Social Login

## How To Use These Skills

When starting a new Web3 project, tell Claude:

> "Load the skills from ./skills/ folder and use them as reference patterns for building this new feature."

Or reference specific skills:

> "Use the pattern from skills/02 for contract interactions and skills/04 for the React hooks."

## Project Source Files Map

```
lib/contracts/config.ts       -> Skill 02 (contract config)
lib/contracts/hooks.ts        -> Skill 02 (read/write functions)
lib/contracts/useContracts.ts -> Skill 04 (React hooks)
lib/contracts/types.ts        -> Skill 02 (TypeScript types)
lib/ipfs/upload.ts            -> Skill 01 (IPFS upload)
lib/validation/metadata.ts    -> Skill 01 (Zod schema)
lib/circle/gateway.ts         -> Skill 06 (cross-chain)
lib/circle/constants.ts       -> Skill 06 (chain config)
lib/circle/evm.ts             -> Skill 06 (hex utilities)
app/auth/page.tsx             -> Skill 03 (Circle auth flow)
app/api/endpoints/route.ts    -> Skill 07 (API proxy)
app/components/BidForm.tsx    -> Skill 05 (two-step tx)
app/components/AuctionDisplay -> Skill 08 (display patterns)
app/components/admin/*        -> Skill 01 + 08 (metadata + admin)
```
