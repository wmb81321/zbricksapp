# Skill: React Hooks for Web3 (Auto-refresh, Events, Countdown)

## What This Covers
Custom React hooks that wrap contract read functions with loading states, error handling, auto-refresh intervals, real-time event subscriptions, and countdown timers.

## Key Pattern: Auto-Refreshing Data Hook

```typescript
"use client";
import { useEffect, useState, useCallback } from "react";

export function useAuctionInfo(refreshInterval = 30000) {
  const [data, setData] = useState<AuctionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      const info = await getAuctionInfo();
      setData(info);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load auction info"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh(); // Initial load

    if (refreshInterval > 0) {
      const interval = setInterval(() => void refresh(), refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, refreshInterval]);

  return { data, loading, error, refresh };
}

// Usage in component:
// const { data: auction, loading, error, refresh } = useAuctionInfo(10000);
```

## Key Pattern: Sorted List Hook (Bid History)

```typescript
export function useBidHistory(refreshInterval = 30000) {
  const [data, setData] = useState<BidInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      const bids = await getBidHistory();
      // Sort by timestamp descending (newest first)
      setData(bids.sort((a, b) => Number(b.timestamp - a.timestamp)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load bid history"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    if (refreshInterval > 0) {
      const interval = setInterval(() => void refresh(), refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, refreshInterval]);

  return { data, loading, error, refresh };
}
```

## Key Pattern: Event Subscription Hook

```typescript
export function useAuctionEvents(callbacks: {
  onBidPlaced?: (bidder: string, amount: bigint, phase: number) => void;
  onPhaseAdvanced?: (oldPhase: number, newPhase: number) => void;
  onAuctionEnded?: (winner: string, finalBid: bigint) => void;
}) {
  useEffect(() => {
    const cleanup = subscribeToAuctionEvents(callbacks);
    return cleanup; // Unsubscribe on unmount
  }, [callbacks]);
}

// Usage:
// useAuctionEvents({
//   onBidPlaced: (bidder, amount) => { refresh(); toast("New bid!"); },
//   onAuctionEnded: (winner) => { router.push("/ganador"); },
// });
```

## Key Pattern: Countdown Timer Hook

```typescript
export function useCountdown(endTime: bigint | null) {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0, total: 0,
  });

  useEffect(() => {
    if (!endTime) return;

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const total = Number(endTime) - now;

      if (total <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      setTimeRemaining({
        days: Math.floor(total / (24 * 60 * 60)),
        hours: Math.floor((total % (24 * 60 * 60)) / (60 * 60)),
        minutes: Math.floor((total % (60 * 60)) / 60),
        seconds: Math.floor(total % 60),
        total,
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000); // Tick every second
    return () => clearInterval(interval);
  }, [endTime]);

  return timeRemaining;
}

// Usage:
// const { days, hours, minutes, seconds } = useCountdown(phaseEndTime);
```

## Key Pattern: Wallet Credentials Hook

```typescript
export function useWalletCredentials() {
  const [credentials, setCredentials] = useState<{
    userToken: string | null;
    walletId: string | null;
    walletAddress: string | null;
  }>({ userToken: null, walletId: null, walletAddress: null });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userToken =
        window.sessionStorage.getItem("w3s_user_token") ||
        window.localStorage.getItem("w3s_user_token");
      const walletId = window.localStorage.getItem("w3s_wallet_id");
      const walletAddress = window.localStorage.getItem("w3s_wallet_address");
      setCredentials({ userToken, walletId, walletAddress });
    }
  }, []);

  const isConnected = !!(credentials.userToken && credentials.walletId);
  return { ...credentials, isConnected };
}
```

## Key Pattern: Parallel Data Loading in Components

```typescript
useEffect(() => {
  async function loadAuctionData() {
    setLoading(true);

    // Parallel fetch - all independent reads at once
    const [auctionInfo, bids, remaining] = await Promise.all([
      getAuctionInfo(),
      getBidHistory(),
      getTimeRemaining(),
    ]);

    setCurrentPhase(auctionInfo.currentPhase);
    setCurrentLeader(auctionInfo.currentLeader);
    setCurrentHighBid(auctionInfo.currentHighBid);
    setIsActive(auctionInfo.isActive);
    setTimeRemaining(remaining);
    setBidHistory(bids);
    setLoading(false);
  }

  loadAuctionData();
  const interval = setInterval(loadAuctionData, 10000); // Refresh every 10s
  return () => clearInterval(interval);
}, []);
```

## Key Pattern: Skeleton Loading State

```tsx
if (loading) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-white/5"></div>
        <div className="h-12 w-full rounded bg-white/5"></div>
        <div className="h-32 w-full rounded bg-white/5"></div>
      </div>
    </div>
  );
}
```

## When To Use
- Any React/Next.js Web3 app that reads on-chain data
- Real-time dashboards (auctions, DEX, portfolio)
- Countdown timers for on-chain deadlines
- Event-driven UIs that react to blockchain events
