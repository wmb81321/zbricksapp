/**
 * Contract Type Definitions
 * 
 * TypeScript types for interacting with the AuctionManager and HouseNFT contracts.
 */

// Auction Manager Types
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

// House NFT Types
export interface NFTMetadata {
  tokenId: bigint;
  owner: string;
  currentPhase: number;
  tokenURI: string;
}

// Transaction Types
export interface TransactionRequest {
  to: string;
  data: string;
  value?: bigint;
  gasLimit?: bigint;
}

export interface TransactionResponse {
  hash: string;
  wait: () => Promise<TransactionReceipt>;
}

export interface TransactionReceipt {
  status: number;
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
}

// Event Types
export interface BidPlacedEvent {
  bidder: string;
  amount: bigint;
  phase: number;
  timestamp: bigint;
}

export interface PhaseAdvancedEvent {
  oldPhase: number;
  newPhase: number;
  timestamp: bigint;
}

export interface AuctionEndedEvent {
  winner: string;
  finalBid: bigint;
  timestamp: bigint;
}
