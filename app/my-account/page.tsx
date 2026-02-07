"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/ui/Header";

export default function AccountPage() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple localStorage check
    const address = localStorage.getItem("walletAddress");
    if (!address) {
      router.push("/auth");
      return;
    }
    setWalletAddress(address);
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">👤 My Account</h1>

        {/* Balance Card - Primary Feature */}
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-6">
          <h2 className="text-lg text-gray-300 mb-2">Total Balance</h2>
          <div className="text-5xl font-bold text-white mb-6">
            0.00 <span className="text-3xl text-gray-400">USDC</span>
          </div>
          
          {/* Send and Receive Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button className="px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
              <span className="text-xl">⬆️</span>
              <span>Send</span>
            </button>
            <button className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
              <span className="text-xl">⬇️</span>
              <span>Receive</span>
            </button>
          </div>

          <div className="mt-4 p-3 bg-black/30 rounded-lg border border-white/10">
            <p className="text-sm text-gray-400">
              💡 Get testnet USDC from the{" "}
              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                Circle Faucet
              </a>
            </p>
          </div>
        </div>

        {/* Wallet Info */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">👛 Wallet Details</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Address</label>
              <p className="text-white font-mono text-sm break-all bg-black/30 p-3 rounded-lg mt-1">
                {walletAddress}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Network</label>
              <p className="text-white">Base Sepolia Testnet (Chain ID: 84532)</p>
            </div>
          </div>
        </div>

        {/* My Bids */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📊 My Bids</h3>
          <p className="text-gray-400 text-center py-8">
            No bids yet. Start bidding on properties!
          </p>
        </div>
      </div>
    </div>
  );
}
