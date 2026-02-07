/**
 * Contract Interaction Utilities - Aligned with ABIs
 * 
 * Functions to interact with AuctionManager and HouseNFT contracts.
 * All functions validated against deployments/abi/*.json
 */

import { ethers } from "ethers";
import { CONTRACTS, RPC_URLS, USDC_ADDRESS } from "./config";
import type {
  AuctionInfo,
  BidInfo,
  NFTMetadata,
  PhaseInfo,
  TransactionResponse,
} from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventLog = any;

/**
 * Get a read-only provider for Base Sepolia
 */
export function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(RPC_URLS.baseSepolia);
}

/**
 * Get a signer from Circle wallet
 * Note: Circle SDK handles signing internally via their API
 */
export async function getCircleSigner(
  userToken: string,
  walletId: string
): Promise<ethers.Signer> {
  const provider = getProvider();
  
  const walletAddress = window.localStorage.getItem("w3s_wallet_address");
  if (!walletAddress) {
    throw new Error("Wallet address not found in localStorage");
  }

  // Simplified signer - actual signing happens through Circle SDK
  class CircleSigner extends ethers.AbstractSigner {
    readonly address: string;

    constructor(address: string, provider: ethers.Provider) {
      super(provider);
      this.address = address;
    }

    async getAddress(): Promise<string> {
      return this.address;
    }

    async signTransaction(): Promise<string> {
      throw new Error("Use Circle SDK for transaction signing");
    }

    async signMessage(): Promise<string> {
      throw new Error("Use Circle SDK for message signing");
    }

    async signTypedData(): Promise<string> {
      throw new Error("Use Circle SDK for typed data signing");
    }

    connect(provider: ethers.Provider): ethers.Signer {
      return new CircleSigner(this.address, provider);
    }
  }

  return new CircleSigner(walletAddress, provider);
}

/**
 * Get contract instances
 */
export function getAuctionManagerContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const providerOrSigner = signerOrProvider || getProvider();
  return new ethers.Contract(
    CONTRACTS.AuctionManager.address,
    CONTRACTS.AuctionManager.abi,
    providerOrSigner
  );
}

export function getHouseNFTContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const providerOrSigner = signerOrProvider || getProvider();
  return new ethers.Contract(
    CONTRACTS.HouseNFT.address,
    CONTRACTS.HouseNFT.abi,
    providerOrSigner
  );
}

export function getUSDCContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const providerOrSigner = signerOrProvider || getProvider();
  const erc20ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
  ];
  return new ethers.Contract(USDC_ADDRESS, erc20ABI, providerOrSigner);
}

// ============================================================================
// AUCTION MANAGER READ FUNCTIONS - Aligned with ABI
// ============================================================================

/**
 * Get current auction state - uses getAuctionState() from ABI
 */
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

/**
 * Get phase information - uses getPhaseInfo(phase) from ABI
 */
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

/**
 * Get current phase info - uses getCurrentPhaseInfo() from ABI
 */
export async function getCurrentPhaseInfo() {
  const contract = getAuctionManagerContract();
  const info = await contract.getCurrentPhaseInfo();
  
  return {
    minDuration: BigInt(info.minDuration.toString()),
    startTime: BigInt(info.startTime.toString()),
    leader: info.leader as string,
    highBid: BigInt(info.highBid.toString()),
    revealed: Boolean(info.revealed),
  };
}

/**
 * Get the minimum bid amount (currentHighBid + 10%)
 * Contract doesn't have minimumBid(), so calculate it
 */
export async function getMinimumBid(): Promise<bigint> {
  const contract = getAuctionManagerContract();
  const currentHighBid = await contract.currentHighBid();
  const current = BigInt(currentHighBid.toString());
  
  // If no bids yet, return starting bid (e.g., $1)
  if (current === BigInt(0)) {
    return BigInt(1_000_000); // $1 in USDC (6 decimals)
  }
  
  // Minimum bid is 10% higher than current high bid
  return current + (current / BigInt(10));
}

/**
 * Get bid history from BidPlaced events
 */
export async function getBidHistory(): Promise<BidInfo[]> {
  const contract = getAuctionManagerContract();
  const provider = getProvider();
  
  try {
    const filter = contract.filters.BidPlaced();
    const events = await contract.queryFilter(filter);
    
    const bidsWithTime = await Promise.all(
      events.map(async (event: EventLog) => {
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
  } catch (error) {
    console.error("Error fetching bid history:", error);
    return [];
  }
}

/**
 * Get time remaining in current phase - uses getTimeRemaining() from ABI
 */
export async function getTimeRemaining(): Promise<bigint> {
  const contract = getAuctionManagerContract();
  const timeRemaining = await contract.getTimeRemaining();
  return BigInt(timeRemaining.toString());
}

/**
 * Check if auction is active - uses isAuctionActive() from ABI
 */
export async function isAuctionActive(): Promise<boolean> {
  const contract = getAuctionManagerContract();
  const active = await contract.isAuctionActive();
  return Boolean(active);
}

/**
 * Get refund amount for a bidder - uses getBidderRefund(address) from ABI
 */
export async function getBidderRefund(bidderAddress: string): Promise<bigint> {
  const contract = getAuctionManagerContract();
  const refund = await contract.getBidderRefund(bidderAddress);
  return BigInt(refund.toString());
}

/**
 * Get current leader and bid - uses getCurrentLeaderAndBid() from ABI
 */
export async function getCurrentLeaderAndBid(): Promise<{
  leader: string;
  highBid: bigint;
}> {
  const contract = getAuctionManagerContract();
  const result = await contract.getCurrentLeaderAndBid();
  
  return {
    leader: result.leader as string,
    highBid: BigInt(result.highBid.toString()),
  };
}

/**
 * Check if auction can advance phase
 */
export async function canAdvancePhase(): Promise<boolean> {
  const contract = getAuctionManagerContract();
  const currentPhase = await contract.currentPhase();
  const timeRemaining = await getTimeRemaining();
  
  return Number(currentPhase) < 3 && Number(timeRemaining) === 0;
}

// ============================================================================
// AUCTION MANAGER WRITE FUNCTIONS
// ============================================================================

/**
 * Place a bid on the auction - uses bid(uint256) from ABI
 * Requires: USDC approval for the bid amount
 */
export async function placeBid(
  amount: bigint,
  userToken: string,
  walletId: string
): Promise<TransactionResponse> {
  const signer = await getCircleSigner(userToken, walletId);
  const contract = getAuctionManagerContract(signer);
  
  // Check USDC approval first
  const usdcContract = getUSDCContract(signer);
  const allowance = await usdcContract.allowance(
    await signer.getAddress(),
    CONTRACTS.AuctionManager.address
  );
  
  if (BigInt(allowance.toString()) < amount) {
    throw new Error("Insufficient USDC allowance. Please approve USDC first.");
  }
  
  const tx = await contract.bid(amount);
  return tx as TransactionResponse;
}

/**
 * Approve USDC for the Auction Manager contract
 */
export async function approveUSDC(
  amount: bigint,
  userToken: string,
  walletId: string
): Promise<TransactionResponse> {
  const signer = await getCircleSigner(userToken, walletId);
  const usdcContract = getUSDCContract(signer);
  
  const tx = await usdcContract.approve(CONTRACTS.AuctionManager.address, amount);
  return tx as TransactionResponse;
}

/**
 * Advance auction to next phase - uses advancePhase() from ABI (admin only)
 */
export async function advancePhase(
  userToken: string,
  walletId: string
): Promise<TransactionResponse> {
  const signer = await getCircleSigner(userToken, walletId);
  const contract = getAuctionManagerContract(signer);
  
  const tx = await contract.advancePhase();
  return tx as TransactionResponse;
}

/**
 * Finalize auction - uses finalizeAuction() from ABI (admin only)
 */
export async function finalizeAuction(
  userToken: string,
  walletId: string
): Promise<TransactionResponse> {
  const signer = await getCircleSigner(userToken, walletId);
  const contract = getAuctionManagerContract(signer);
  
  const tx = await contract.finalizeAuction();
  return tx as TransactionResponse;
}

// ============================================================================
// HOUSE NFT READ FUNCTIONS - Aligned with ABI
// ============================================================================

/**
 * Get NFT metadata including current phase and token URI
 */
export async function getNFTMetadata(): Promise<NFTMetadata> {
  const contract = getHouseNFTContract();
  
  const tokenId = BigInt(1); // The NFT is always token ID 1
  const [owner, currentPhase, tokenURI] = await Promise.all([
    contract.ownerOf(tokenId),
    contract.currentPhase(),
    contract.tokenURI(tokenId),
  ]);

  return {
    tokenId,
    owner: owner as string,
    currentPhase: Number(currentPhase),
    tokenURI: tokenURI as string,
  };
}

/**
 * Get the current phase of the NFT
 */
export async function getNFTCurrentPhase(): Promise<number> {
  const contract = getHouseNFTContract();
  const phase = await contract.currentPhase();
  return Number(phase);
}

/**
 * Get the metadata URI for a specific phase - uses getPhaseURI(phase) from ABI
 */
export async function getPhaseURI(phase: number): Promise<string> {
  const contract = getHouseNFTContract();
  const uri = await contract.getPhaseURI(phase);
  return uri as string;
}

/**
 * Get controller address
 */
export async function getController(): Promise<string> {
  const contract = getHouseNFTContract();
  const controller = await contract.controller();
  return controller as string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format USDC amount (6 decimals) to human readable string
 */
export function formatUSDC(amount: bigint): string {
  const value = Number(amount) / 1e6;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Parse USDC amount from human readable string to bigint (6 decimals)
 */
export function parseUSDC(amount: string): bigint {
  const cleaned = amount.replace(/[^0-9.]/g, "");
  const value = parseFloat(cleaned);
  if (isNaN(value)) {
    throw new Error("Invalid USDC amount");
  }
  return BigInt(Math.floor(value * 1e6));
}

/**
 * Format timestamp to human readable date
 */
export function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString();
}

/**
 * Get time remaining in human readable format
 */
export function getTimeRemainingFormatted(endTime: bigint): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const now = Math.floor(Date.now() / 1000);
  const total = Number(endTime) - now;
  
  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  
  const days = Math.floor(total / (24 * 60 * 60));
  const hours = Math.floor((total % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((total % (60 * 60)) / 60);
  const seconds = Math.floor(total % 60);
  
  return { days, hours, minutes, seconds, total };
}

/**
 * Subscribe to auction events
 */
export function subscribeToAuctionEvents(callbacks: {
  onBidPlaced?: (bidder: string, amount: bigint, phase: number) => void;
  onPhaseAdvanced?: (oldPhase: number, newPhase: number) => void;
  onAuctionEnded?: (winner: string, finalBid: bigint) => void;
}) {
  const contract = getAuctionManagerContract();
  
  const listeners: Array<() => void> = [];

  if (callbacks.onBidPlaced) {
    const onBidPlaced = (bidder: string, amount: bigint, phase: number) => {
      callbacks.onBidPlaced?.(bidder, BigInt(amount.toString()), Number(phase));
    };
    contract.on("BidPlaced", onBidPlaced);
    listeners.push(() => contract.off("BidPlaced", onBidPlaced));
  }

  if (callbacks.onPhaseAdvanced) {
    const onPhaseAdvanced = (oldPhase: number, newPhase: number) => {
      callbacks.onPhaseAdvanced?.(Number(oldPhase), Number(newPhase));
    };
    contract.on("PhaseAdvanced", onPhaseAdvanced);
    listeners.push(() => contract.off("PhaseAdvanced", onPhaseAdvanced));
  }

  if (callbacks.onAuctionEnded) {
    const onAuctionEnded = (winner: string, finalBid: bigint) => {
      callbacks.onAuctionEnded?.(winner, BigInt(finalBid.toString()));
    };
    contract.on("AuctionEnded", onAuctionEnded);
    listeners.push(() => contract.off("AuctionEnded", onAuctionEnded));
  }

  // Return cleanup function
  return () => {
    listeners.forEach((cleanup) => cleanup());
  };
}
