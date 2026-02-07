/**
 * Contract Integration Module
 * 
 * Re-exports all contract-related functionality for convenient importing.
 * 
 * Usage:
 * import { getAuctionInfo, placeBid, formatUSDC } from "@/lib/contracts";
 * import { useAuctionInfo, useBidHistory } from "@/lib/contracts";
 */

// Configuration
export * from "./config";

// Types
export * from "./types";

// Contract interaction functions
export * from "./hooks";

// React hooks
export * from "./useContracts";
