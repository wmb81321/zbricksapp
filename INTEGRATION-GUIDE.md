# Smart Contract Integration Guide

This guide explains how the deployed smart contracts have been integrated into the frontend application.

## Overview

The integration includes:
- **HouseNFT Contract**: Manages the progressive NFT metadata reveal across 4 phases
- **AuctionManager Contract**: Handles the auction lifecycle, bidding, and phase management
- **USDC Token**: Used as the bidding currency

## File Structure

```
lib/
  contracts/
    config.ts       # Contract addresses, ABIs, and chain configuration
    types.ts        # TypeScript type definitions for contract data
    hooks.ts        # Functions to read from and write to contracts
app/
  components/
    AuctionContractDemo.tsx  # Example component showing contract usage
```

## Quick Start

### 1. Install Dependencies

First, install the required dependencies:

```bash
npm install
```

The `ethers` package has been added to `package.json` for contract interactions.

### 2. Import Contract Functions

```typescript
import {
  getAuctionInfo,
  getBidHistory,
  placeBid,
  approveUSDC,
  formatUSDC,
  parseUSDC,
} from "@/lib/contracts/hooks";
```

### 3. Read Auction Data

```typescript
// Get current auction information
const auctionInfo = await getAuctionInfo();
console.log("Current high bid:", formatUSDC(auctionInfo.currentHighBid));
console.log("Current winner:", auctionInfo.currentWinner);
console.log("Is active:", auctionInfo.isActive);

// Get bid history
const bids = await getBidHistory();
console.log("Total bids:", bids.length);

// Get NFT metadata
const nftMetadata = await getNFTMetadata();
console.log("Current phase:", nftMetadata.currentPhase);
console.log("Token URI:", nftMetadata.tokenURI);
```

### 4. Place a Bid

```typescript
// User's Circle wallet credentials
const userToken = localStorage.getItem("w3s_user_token");
const walletId = localStorage.getItem("w3s_wallet_id");

// Amount in USDC (e.g., $100.00)
const bidAmount = parseUSDC("100.00");

// Step 1: Approve USDC for the auction contract
const approveTx = await approveUSDC(bidAmount, userToken!, walletId!);
await approveTx.wait(); // Wait for confirmation

// Step 2: Place the bid
const bidTx = await placeBid(bidAmount, userToken!, walletId!);
await bidTx.wait(); // Wait for confirmation

console.log("Bid placed successfully!");
```

## Key Functions

### Read Functions (No Transaction Required)

#### `getAuctionInfo()`
Returns current auction state including high bid, winner, active status, current phase, and phase end time.

```typescript
interface AuctionInfo {
  currentHighBid: bigint;
  currentWinner: string;
  isActive: boolean;
  currentPhase: number;
  phaseEndTime: bigint;
}
```

#### `getBidHistory()`
Returns all bids placed on the auction by querying historical events.

```typescript
interface BidInfo {
  bidder: string;
  amount: bigint;
  timestamp: bigint;
  phase: number;
}
```

#### `getNFTMetadata()`
Returns NFT information including owner, current phase, and metadata URI.

```typescript
interface NFTMetadata {
  tokenId: bigint;
  owner: string;
  currentPhase: number;
  tokenURI: string;
}
```

#### `getMinimumBid()`
Returns the minimum bid amount required (10% above current high bid, or starting bid).

#### `canAdvancePhase()`
Checks if the auction can advance to the next phase (phase ended and not on final phase).

### Write Functions (Requires Transaction)

#### `approveUSDC(amount, userToken, walletId)`
Approves the AuctionManager contract to spend USDC on behalf of the user. Must be called before placing a bid.

#### `placeBid(amount, userToken, walletId)`
Places a bid on the auction. Requires prior USDC approval.

#### `advancePhase(userToken, walletId)` 
Advances the auction to the next phase (admin only). Can only be called after current phase ends.

#### `endAuction(userToken, walletId)`
Ends the auction and transfers NFT to winner (admin only).

### Utility Functions

#### `formatUSDC(amount: bigint): string`
Formats a USDC amount (6 decimals) to a human-readable string like "$100.00".

#### `parseUSDC(amount: string): bigint`
Parses a human-readable amount like "100.00" to USDC format (6 decimals).

#### `formatTimestamp(timestamp: bigint): string`
Formats a Unix timestamp to a localized date/time string.

#### `getTimeRemaining(endTime: bigint)`
Calculates time remaining until a specific timestamp.

```typescript
{
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}
```

#### `subscribeToAuctionEvents(callbacks)`
Subscribe to real-time contract events.

```typescript
const cleanup = subscribeToAuctionEvents({
  onBidPlaced: (bidder, amount, phase) => {
    console.log("New bid:", formatUSDC(amount));
  },
  onPhaseAdvanced: (oldPhase, newPhase) => {
    console.log(`Phase changed: ${oldPhase} → ${newPhase}`);
  },
  onAuctionEnded: (winner, finalBid) => {
    console.log("Auction ended!");
  },
});

// Call cleanup() when component unmounts
```

## Contract Addresses

The contracts are deployed on **Base Sepolia** (Chain ID: 84532):

- **HouseNFT**: `0x7ea51d8855ba98c6167f71d272813faba1244a0c`
- **AuctionManager**: `0xe6afb32fdd1c03edd3dc2f1b0037c3d4580d6dca`
- **USDC**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## Example: Complete Bidding Flow

```typescript
import { useState } from "react";
import {
  getAuctionInfo,
  getMinimumBid,
  approveUSDC,
  placeBid,
  parseUSDC,
  formatUSDC,
} from "@/lib/contracts/hooks";

function BiddingComponent() {
  const [bidAmount, setBidAmount] = useState("");
  const [status, setStatus] = useState("");

  async function handleBid() {
    try {
      // Get user credentials
      const userToken = localStorage.getItem("w3s_user_token");
      const walletId = localStorage.getItem("w3s_wallet_id");
      
      if (!userToken || !walletId) {
        setStatus("Please connect your wallet first");
        return;
      }

      // Parse bid amount
      const amount = parseUSDC(bidAmount);
      
      // Check minimum bid
      const minBid = await getMinimumBid();
      if (amount < minBid) {
        setStatus(`Bid must be at least ${formatUSDC(minBid)}`);
        return;
      }

      // Step 1: Approve USDC
      setStatus("Approving USDC...");
      const approveTx = await approveUSDC(amount, userToken, walletId);
      await approveTx.wait();

      // Step 2: Place bid
      setStatus("Placing bid...");
      const bidTx = await placeBid(amount, userToken, walletId);
      await bidTx.wait();

      setStatus(`Bid of ${formatUSDC(amount)} placed successfully!`);
      setBidAmount("");

      // Refresh auction info
      const info = await getAuctionInfo();
      console.log("New high bid:", formatUSDC(info.currentHighBid));
    } catch (error) {
      console.error("Error placing bid:", error);
      setStatus(`Error: ${error.message}`);
    }
  }

  return (
    <div>
      <input
        type="text"
        value={bidAmount}
        onChange={(e) => setBidAmount(e.target.value)}
        placeholder="Enter bid amount"
      />
      <button onClick={handleBid}>Place Bid</button>
      {status && <p>{status}</p>}
    </div>
  );
}
```

## Example Component

A complete example component is available at [`app/components/AuctionContractDemo.tsx`](app/components/AuctionContractDemo.tsx). This component demonstrates:

- Loading and displaying auction data
- Real-time countdown timer
- Bid placement with USDC approval
- Live event subscriptions
- Bid history display
- Admin controls for phase advancement

To use it in a page:

```typescript
import AuctionContractDemo from "@/app/components/AuctionContractDemo";

export default function AuctionPage() {
  return <AuctionContractDemo />;
}
```

## Progressive NFT Reveal

The HouseNFT contract implements a progressive metadata reveal system:

1. **Phase 0 (Discovery)**: Basic property information
2. **Phase 1 (Exploration)**: More details revealed
3. **Phase 2 (Decision)**: Additional information
4. **Phase 3 (Final)**: Complete property details

As the auction advances through phases, the NFT's `tokenURI()` automatically returns the metadata for the current phase.

```typescript
// Get current NFT phase and metadata
const nft = await getNFTMetadata();
console.log("Current phase:", nft.currentPhase);
console.log("Metadata URI:", nft.tokenURI);

// Get a specific phase's URI directly
const phase2URI = await getPhaseURI(2);
console.log("Phase 2 metadata:", phase2URI);
```

## Important Notes

### Circle Wallet Integration

The contract functions work with Circle's wallet system:
- User authentication via `w3s_user_token`
- Wallet identification via `w3s_wallet_id`
- Wallet address via `w3s_wallet_address`

These values are stored in localStorage/sessionStorage by Circle's SDK.

### Transaction Signing

Currently, the `CircleSigner` implementation is a placeholder. For production:

1. Circle provides their own SDK methods for transaction signing
2. You may need to use Circle's transaction APIs instead of direct ethers.js signing
3. Consult Circle's documentation for their specific transaction flow

### Gas Fees

All transactions require Base Sepolia ETH for gas fees. Users need:
- USDC for bidding
- ETH for transaction gas fees

### Event Monitoring

The `subscribeToAuctionEvents()` function provides real-time updates. Make sure to:
- Call the cleanup function when components unmount
- Handle reconnection if the WebSocket connection drops

## Testing

Test the integration on Base Sepolia:

1. Get test ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
2. Get test USDC from Circle or use the deployed USDC contract
3. Connect your Circle wallet
4. Try placing a small bid to test the flow

## Contract Reference

For detailed contract documentation, see:
- [CONTRACT-REFERENCE.md](../CONTRACT-REFERENCE.md) - Complete API documentation
- [README.md](../README.md) - Project overview and setup

## Support

If you encounter issues:
1. Check browser console for error messages
2. Verify wallet connection and balances
3. Ensure you're on Base Sepolia network
4. Review transaction status on [BaseScan](https://sepolia.basescan.org/)
