# Skill: Web3 Component Patterns (Auction Display, Admin Auth)

## What This Covers
Reusable component patterns for Web3 dApps: real-time data displays, admin authorization, address formatting, phase progress bars, bid history lists, and transaction result displays.

## Key Pattern: Real-Time Auction Display Component

```typescript
"use client";
import { useEffect, useState } from "react";
import { getAuctionInfo, getBidHistory, getTimeRemaining, formatUSDC } from "@/lib/contracts";

export default function AuctionDisplay({ onBidClick }: { onBidClick?: () => void }) {
  const [loading, setLoading] = useState(true);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentLeader, setCurrentLeader] = useState("");
  const [currentHighBid, setCurrentHighBid] = useState(BigInt(0));
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(BigInt(0));
  const [bidHistory, setBidHistory] = useState<BidInfo[]>([]);

  useEffect(() => {
    async function loadData() {
      const [auctionInfo, bids, remaining] = await Promise.all([
        getAuctionInfo(),
        getBidHistory(),
        getTimeRemaining(),
      ]);
      // Set all state...
      setLoading(false);
    }

    loadData();
    const interval = setInterval(loadData, 10000); // Auto-refresh
    return () => clearInterval(interval);
  }, []);

  // ... render
}
```

## Key Pattern: Admin Authorization Hook

```typescript
// lib/hooks/useAdminAuth.ts
export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const walletAddress = localStorage.getItem("walletAddress");
    const adminAddress = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;

    setIsAdmin(
      !!walletAddress &&
      !!adminAddress &&
      walletAddress.toLowerCase() === adminAddress.toLowerCase()
    );
    setLoading(false);
  }, []);

  return { isAdmin, loading };
}

// Usage in admin page:
export default function AdminPage() {
  const { isAdmin, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) router.push("/");
  }, [isAdmin, loading]);

  if (loading || !isAdmin) return null;
  // ... render admin content
}
```

## Key Pattern: Address Formatting

```typescript
const formatAddress = (addr: string) => {
  if (!addr || addr === "0x0000000000000000000000000000000000000000") {
    return "No bids yet";
  }
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};
// "0x1234567890abcdef" -> "0x1234...cdef"
```

## Key Pattern: Time Remaining Formatter

```typescript
const formatTimeRemaining = (seconds: bigint) => {
  const total = Number(seconds);
  if (total <= 0) return "Ended";

  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

  return parts.join(" ");
};
```

## Key Pattern: Phase Progress Bar

```tsx
<div className="flex gap-2">
  {[0, 1, 2, 3].map((phase) => (
    <div
      key={phase}
      className={`h-2 flex-1 rounded-full ${
        phase <= currentPhase ? "bg-[#2DD4D4]" : "bg-white/10"
      }`}
    />
  ))}
</div>
```

## Key Pattern: Bid History List

```tsx
<div className="space-y-3">
  {bidHistory.slice().reverse().slice(0, 10).map((bid, idx) => (
    <div key={idx} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2DD4D4]/10 text-sm font-semibold text-[#2DD4D4]">
          #{bidHistory.length - idx}
        </div>
        <div>
          <p className="font-medium text-white">{formatAddress(bid.bidder)}</p>
          <p className="text-xs text-white/50">Phase {bid.phase + 1}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-white">{formatUSDC(bid.amount)}</p>
        <p className="text-xs text-white/50">
          {new Date(Number(bid.timestamp) * 1000).toLocaleTimeString()}
        </p>
      </div>
    </div>
  ))}
</div>
```

## Key Pattern: Transaction Result Display

```tsx
{/* Success with link to block explorer */}
{txHash && (
  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
    <p className="text-blue-400 font-semibold mb-2">Transaction Sent</p>
    <a
      href={`https://sepolia.basescan.org/tx/${txHash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-blue-400 hover:underline break-all"
    >
      View on BaseScan: {txHash}
    </a>
  </div>
)}

{/* IPFS upload success */}
{ipfsUrl && (
  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
    <p className="text-green-400 font-semibold mb-2">Upload Successful!</p>
    <a href={ipfsUrl} target="_blank" rel="noopener noreferrer"
      className="text-sm text-blue-400 hover:underline break-all">
      {ipfsUrl}
    </a>
  </div>
)}
```

## Key Pattern: Loading Spinner (Processing State)

```tsx
{isProcessing && (
  <div className="text-center py-8">
    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-purple-500 mb-4"></div>
    <p className="text-gray-300">Processing...</p>
  </div>
)}
```

## Key Pattern: Dark Web3 Theme (Tailwind Classes)

```
Background:     bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900
Cards:          bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl
Inputs:         bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500
Buttons:        bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600
Active accent:  bg-[#2DD4D4] text-black (teal/cyan)
Error:          bg-red-500/10 border border-red-500/30 text-red-400
Success:        bg-green-500/10 border border-green-500/30 text-green-400
Muted text:     text-white/50
```

## When To Use
- Any Web3 dashboard or auction interface
- Admin panels with wallet-based authorization
- Real-time data displays with auto-refresh
- Transaction status tracking with block explorer links
