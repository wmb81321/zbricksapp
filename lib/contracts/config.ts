/**
 * Contract Configuration
 * 
 * This file contains contract addresses and ABIs for the deployed contracts.
 * Based on deployments/addresses.json and ABIs from deployments/abi/
 */

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

// USDC address on Base Sepolia
export const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// RPC URLs
export const RPC_URLS = {
  baseSepolia: "https://sepolia.base.org",
};

export type ContractName = keyof typeof CONTRACTS;
