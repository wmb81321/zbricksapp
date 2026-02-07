/**
 * React Hooks for Contract Interactions
 * 
 * Custom React hooks that make it easier to use contract functions in components.
 * These hooks handle loading states, errors, and automatic data refreshing.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAuctionInfo,
  getBidHistory,
  getNFTMetadata,
  getMinimumBid,
  subscribeToAuctionEvents,
} from "./hooks";
import type { AuctionInfo, BidInfo, NFTMetadata } from "./types";

/**
 * Hook to load and auto-refresh auction information
 */
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
    void refresh();
    
    if (refreshInterval > 0) {
      const interval = setInterval(() => void refresh(), refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, refreshInterval]);

  return { data, loading, error, refresh };
}

/**
 * Hook to load and auto-refresh bid history
 */
export function useBidHistory(refreshInterval = 30000) {
  const [data, setData] = useState<BidInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      const bids = await getBidHistory();
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

/**
 * Hook to load NFT metadata
 */
export function useNFTMetadata(refreshInterval = 30000) {
  const [data, setData] = useState<NFTMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      const metadata = await getNFTMetadata();
      setData(metadata);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load NFT metadata"));
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

/**
 * Hook to get minimum bid amount
 */
export function useMinimumBid() {
  const [data, setData] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const minBid = await getMinimumBid();
        setData(minBid);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load minimum bid"));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return { data, loading, error };
}

/**
 * Hook to subscribe to auction events
 */
export function useAuctionEvents(callbacks: {
  onBidPlaced?: (bidder: string, amount: bigint, phase: number) => void;
  onPhaseAdvanced?: (oldPhase: number, newPhase: number) => void;
  onAuctionEnded?: (winner: string, finalBid: bigint) => void;
}) {
  useEffect(() => {
    const cleanup = subscribeToAuctionEvents(callbacks);
    return cleanup;
  }, [callbacks]);
}

/**
 * Hook to get wallet credentials from localStorage
 */
export function useWalletCredentials() {
  const [credentials, setCredentials] = useState<{
    userToken: string | null;
    walletId: string | null;
    walletAddress: string | null;
  }>({
    userToken: null,
    walletId: null,
    walletAddress: null,
  });

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

/**
 * Hook for countdown timer
 */
export function useCountdown(endTime: bigint | null) {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
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

      const days = Math.floor(total / (24 * 60 * 60));
      const hours = Math.floor((total % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((total % (60 * 60)) / 60);
      const seconds = Math.floor(total % 60);

      setTimeRemaining({ days, hours, minutes, seconds, total });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return timeRemaining;
}
