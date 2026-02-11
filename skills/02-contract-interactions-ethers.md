# Skill: Smart Contract Interactions (ethers.js v6)

## What This Covers
Full pattern for reading/writing smart contracts using ethers.js v6 with typed contract config, ABI-aligned functions, event subscriptions, and USDC token handling.

## Key Pattern: Contract Configuration Module

```typescript
// lib/contracts/config.ts
import AuctionManagerABI from "../../deployments/abi/AuctionManager.json";
import HouseNFTABI from "../../deployments/abi/HouseNFT.json";

export const CHAIN_ID = 84532; // Base Sepolia

export const CONTRACTS = {
  HouseNFT: {
    address: "0x7ea51d8855ba98c6167f71d272813faba1244a0c" as const,
    abi: HouseNFTABI,
  },
  AuctionManager: {
    address: "0xe6afb32fdd1c03edd3dc2f1b0037c3d4580d6dca" as const,
    abi: AuctionManagerABI,
  },
} as const;

export const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export const RPC_URLS = {
  baseSepolia: "https://sepolia.base.org",
};

export type ContractName = keyof typeof CONTRACTS;
```

## Key Pattern: Provider & Contract Factory

```typescript
// Read-only provider
export function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(RPC_URLS.baseSepolia);
}

// Contract factories (accept optional signer for write operations)
export function getAuctionManagerContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(
    CONTRACTS.AuctionManager.address,
    CONTRACTS.AuctionManager.abi,
    signerOrProvider || getProvider()
  );
}

// Inline ABI for standard ERC-20 operations
export function getUSDCContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const erc20ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
  ];
  return new ethers.Contract(USDC_ADDRESS, erc20ABI, signerOrProvider || getProvider());
}
```

## Key Pattern: TypeScript Types for Contract Data

```typescript
// lib/contracts/types.ts
export interface AuctionInfo {
  currentPhase: number;
  currentLeader: string;
  currentHighBid: bigint;
  isActive: boolean;
}

export interface PhaseInfo {
  phase: number;
  duration: bigint;
  endTime: bigint;
  startTime: bigint;
  isActive: boolean;
  leader: string;
  highBid: bigint;
  revealed: boolean;
}

export interface BidInfo {
  bidder: string;
  amount: bigint;
  timestamp: bigint;
  phase: number;
}

export interface TransactionResponse {
  hash: string;
  wait: () => Promise<TransactionReceipt>;
}
```

## Key Pattern: Read Functions (ABI-Aligned)

```typescript
// Get auction state - uses getAuctionState() from ABI
export async function getAuctionInfo(): Promise<AuctionInfo> {
  const contract = getAuctionManagerContract();
  const state = await contract.getAuctionState();

  return {
    currentPhase: Number(state._currentPhase),
    currentLeader: state._currentLeader as string,
    currentHighBid: BigInt(state._currentHighBid.toString()),
    isActive: !state._finalized && state._biddingOpen,
  };
}

// Get phase-specific info
export async function getPhaseInfo(phase: number): Promise<PhaseInfo> {
  const contract = getAuctionManagerContract();
  const info = await contract.getPhaseInfo(phase);
  const currentPhase = await contract.currentPhase();

  return {
    phase,
    duration: BigInt(info.minDuration.toString()),
    endTime: BigInt(info.startTime.toString()) + BigInt(info.minDuration.toString()),
    startTime: BigInt(info.startTime.toString()),
    isActive: Number(currentPhase) === phase,
    leader: info.leader as string,
    highBid: BigInt(info.highBid.toString()),
    revealed: Boolean(info.revealed),
  };
}

// Calculated values (not direct ABI calls)
export async function getMinimumBid(): Promise<bigint> {
  const contract = getAuctionManagerContract();
  const currentHighBid = await contract.currentHighBid();
  const current = BigInt(currentHighBid.toString());

  if (current === BigInt(0)) return BigInt(1_000_000); // $1 USDC
  return current + (current / BigInt(10)); // +10%
}
```

## Key Pattern: Event Queries (Bid History from Logs)

```typescript
export async function getBidHistory(): Promise<BidInfo[]> {
  const contract = getAuctionManagerContract();
  const provider = getProvider();

  const filter = contract.filters.BidPlaced();
  const events = await contract.queryFilter(filter);

  const bidsWithTime = await Promise.all(
    events.map(async (event) => {
      const block = await provider.getBlock(event.blockNumber);
      return {
        bidder: event.args?.[0] as string,
        amount: BigInt((event.args?.[1] as bigint).toString()),
        phase: Number(event.args?.[2]),
        timestamp: BigInt(block?.timestamp || 0),
      };
    })
  );

  return bidsWithTime;
}
```

## Key Pattern: Write Functions (Signer Required)

```typescript
// Place bid (requires prior USDC approval)
export async function placeBid(
  amount: bigint, userToken: string, walletId: string
): Promise<TransactionResponse> {
  const signer = await getCircleSigner(userToken, walletId);
  const contract = getAuctionManagerContract(signer);

  // Check allowance before calling
  const usdcContract = getUSDCContract(signer);
  const allowance = await usdcContract.allowance(
    await signer.getAddress(),
    CONTRACTS.AuctionManager.address
  );

  if (BigInt(allowance.toString()) < amount) {
    throw new Error("Insufficient USDC allowance. Please approve USDC first.");
  }

  return await contract.bid(amount);
}

// ERC-20 approve
export async function approveUSDC(
  amount: bigint, userToken: string, walletId: string
): Promise<TransactionResponse> {
  const signer = await getCircleSigner(userToken, walletId);
  const usdcContract = getUSDCContract(signer);
  return await usdcContract.approve(CONTRACTS.AuctionManager.address, amount);
}
```

## Key Pattern: Real-time Event Subscription

```typescript
export function subscribeToAuctionEvents(callbacks: {
  onBidPlaced?: (bidder: string, amount: bigint, phase: number) => void;
  onPhaseAdvanced?: (oldPhase: number, newPhase: number) => void;
  onAuctionEnded?: (winner: string, finalBid: bigint) => void;
}) {
  const contract = getAuctionManagerContract();
  const listeners: Array<() => void> = [];

  if (callbacks.onBidPlaced) {
    const handler = (bidder: string, amount: bigint, phase: number) => {
      callbacks.onBidPlaced?.(bidder, BigInt(amount.toString()), Number(phase));
    };
    contract.on("BidPlaced", handler);
    listeners.push(() => contract.off("BidPlaced", handler));
  }

  // ... same for PhaseAdvanced, AuctionEnded

  // Return cleanup function (use in useEffect)
  return () => listeners.forEach((cleanup) => cleanup());
}
```

## Key Pattern: USDC Formatting Utilities

```typescript
// USDC has 6 decimals (not 18 like ETH)
export function formatUSDC(amount: bigint): string {
  const value = Number(amount) / 1e6;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function parseUSDC(amount: string): bigint {
  const cleaned = amount.replace(/[^0-9.]/g, "");
  const value = parseFloat(cleaned);
  return BigInt(Math.floor(value * 1e6));
}
```

## Key Pattern: Barrel Export

```typescript
// lib/contracts/index.ts
export * from "./config";
export * from "./types";
export * from "./hooks";        // Contract interaction functions
export * from "./useContracts";  // React hooks

// Usage anywhere in app:
// import { getAuctionInfo, placeBid, formatUSDC, useAuctionInfo } from "@/lib/contracts";
```

## When To Use
- Any dApp interacting with smart contracts on EVM chains
- Projects using ethers.js v6 (not v5)
- Apps with ERC-20 token operations (approve/transfer patterns)
- Real-time blockchain event listening
- USDC or other stablecoin integration (6 decimal handling)
