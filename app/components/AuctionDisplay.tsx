"use client";

import { useEffect, useState } from "react";
import {
  getAuctionInfo,
  getBidHistory,
  getTimeRemaining,
  formatUSDC,
  type BidInfo,
} from "@/lib/contracts";

interface AuctionDisplayProps {
  onBidClick?: () => void;
}

export default function AuctionDisplay({ onBidClick }: AuctionDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentLeader, setCurrentLeader] = useState("");
  const [currentHighBid, setCurrentHighBid] = useState(BigInt(0));
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(BigInt(0));
  const [bidHistory, setBidHistory] = useState<BidInfo[]>([]);

  useEffect(() => {
    async function loadAuctionData() {
      try {
        setLoading(true);
        setError(null);

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
      } catch (err) {
        console.error("Error loading auction data:", err);
        setError("Error al cargar datos de la subasta");
      } finally {
        setLoading(false);
      }
    }

    loadAuctionData();

    // Refresh every 10 seconds
    const interval = setInterval(loadAuctionData, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeRemaining = (seconds: bigint) => {
    const total = Number(seconds);
    if (total <= 0) return "Finalizado";

    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

    return parts.join(" ");
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr === "0x0000000000000000000000000000000000000000") {
      return "No hay pujas";
    }
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

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

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const phaseNames = ["Teaser", "Básico", "Detallado", "Final"];

  return (
    <div className="space-y-6">
      {/* Auction Status Card */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">
              Fase {currentPhase + 1}: {phaseNames[currentPhase]}
            </h3>
            <p className="mt-1 text-sm text-white/50">
              {isActive ? "🟢 Activa" : "🔴 Finalizada"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/50">Tiempo restante</p>
            <p className="text-2xl font-semibold text-[#2DD4D4]">
              {formatTimeRemaining(timeRemaining)}
            </p>
          </div>
        </div>

        {/* Current High Bid */}
        <div className="mb-6 rounded-2xl border border-[#2DD4D4]/20 bg-[#2DD4D4]/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/50">Puja más alta</p>
              <p className="mt-1 text-4xl font-bold text-white">
                {formatUSDC(currentHighBid)}
              </p>
              <p className="mt-2 text-sm text-white/60">
                Líder: {formatAddress(currentLeader)}
              </p>
            </div>
            {isActive && onBidClick && (
              <button
                onClick={onBidClick}
                className="rounded-xl bg-[#2DD4D4] px-6 py-3 font-semibold text-black transition hover:brightness-110"
              >
                Hacer puja
              </button>
            )}
          </div>
        </div>

        {/* Phase Progress */}
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
      </div>

      {/* Bid History */}
      {bidHistory.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
          <h4 className="mb-4 text-xl font-semibold text-white">
            Historial de pujas ({bidHistory.length})
          </h4>
          <div className="space-y-3">
            {bidHistory
              .slice()
              .reverse()
              .slice(0, 10)
              .map((bid, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2DD4D4]/10 text-sm font-semibold text-[#2DD4D4]">
                      #{bidHistory.length - idx}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {formatAddress(bid.bidder)}
                      </p>
                      <p className="text-xs text-white/50">
                        Fase {bid.phase + 1}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {formatUSDC(bid.amount)}
                    </p>
                    <p className="text-xs text-white/50">
                      {new Date(Number(bid.timestamp) * 1000).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
