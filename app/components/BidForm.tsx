"use client";

import { useState, useEffect } from "react";
import {
  getMinimumBid,
  placeBid,
  approveUSDC,
  formatUSDC,
  parseUSDC,
} from "@/lib/contracts";

interface BidFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function BidForm({ onSuccess, onCancel }: BidFormProps) {
  const [bidAmount, setBidAmount] = useState("");
  const [minimumBid, setMinimumBid] = useState(BigInt(0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [step, setStep] = useState<"input" | "approve" | "bid">("input");

  useEffect(() => {
    async function loadMinimumBid() {
      try {
        const minBid = await getMinimumBid();
        setMinimumBid(minBid);
        // Set default bid amount to minimum
        setBidAmount((Number(minBid) / 1e6).toFixed(2));
      } catch (err) {
        console.error("Error loading minimum bid:", err);
        setError("Error al cargar puja mínima");
      }
    }

    loadMinimumBid();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userToken =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("w3s_user_token") ||
          window.localStorage.getItem("w3s_user_token")
        : null;

    const walletId =
      typeof window !== "undefined"
        ? window.localStorage.getItem("w3s_wallet_id")
        : null;

    if (!userToken || !walletId) {
      setError("Wallet no conectado. Por favor inicia sesión.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Parse bid amount
      const amount = parseUSDC(bidAmount);

      // Validate minimum bid
      if (amount < minimumBid) {
        setError(`La puja debe ser al menos ${formatUSDC(minimumBid)}`);
        setLoading(false);
        return;
      }

      // Step 1: Approve USDC
      setStep("approve");
      setStatus("Aprobando USDC...");
      await approveUSDC(amount, userToken, walletId);

      // Wait a bit for transaction to be mined
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Step 2: Place bid
      setStep("bid");
      setStatus("Colocando puja...");
      await placeBid(amount, userToken, walletId);

      setStatus("¡Puja exitosa!");
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      console.error("Error placing bid:", err);
      const message = err instanceof Error ? err.message : "Error al colocar puja";
      setError(message);
      setStep("input");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^0-9.]/g, "");
    
    // Split by decimal point
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + "." + parts[1].slice(0, 2);
    }
    
    return cleaned;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setBidAmount(formatted);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Cantidad (USDC)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-white/50">
            $
          </span>
          <input
            type="text"
            value={bidAmount}
            onChange={handleAmountChange}
            placeholder="0.00"
            disabled={loading}
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] py-4 pl-10 pr-4 text-2xl font-semibold text-white outline-none transition focus:border-[#2DD4D4]/50 disabled:opacity-50"
          />
        </div>
        <p className="mt-2 text-sm text-white/50">
          Puja mínima: {formatUSDC(minimumBid)}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Status Message */}
      {status && !error && (
        <div className="rounded-xl border border-[#2DD4D4]/20 bg-[#2DD4D4]/5 p-4">
          <p className="text-sm text-[#2DD4D4]">{status}</p>
        </div>
      )}

      {/* Steps Indicator */}
      {loading && (
        <div className="flex gap-4">
          <div
            className={`flex-1 rounded-lg p-3 text-center text-sm ${
              step === "approve"
                ? "bg-[#2DD4D4]/20 text-[#2DD4D4]"
                : "bg-white/5 text-white/50"
            }`}
          >
            1. Aprobar USDC
          </div>
          <div
            className={`flex-1 rounded-lg p-3 text-center text-sm ${
              step === "bid"
                ? "bg-[#2DD4D4]/20 text-[#2DD4D4]"
                : "bg-white/5 text-white/50"
            }`}
          >
            2. Colocar puja
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] py-3 font-semibold text-white transition hover:bg-white/[0.04] disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !bidAmount || parseFloat(bidAmount) <= 0}
          className="flex-1 rounded-xl bg-[#2DD4D4] py-3 font-semibold text-black transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Procesando..." : "Confirmar puja"}
        </button>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
        <p className="text-xs text-white/50">
          ℹ️ Se requieren 2 transacciones: primero aprobar USDC, luego colocar la puja.
          Asegúrate de tener USDC suficiente en tu wallet.
        </p>
      </div>
    </form>
  );
}
