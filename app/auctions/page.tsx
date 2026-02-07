"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/ui/Header";
import AuctionDisplay from "../components/AuctionDisplay";
import BidForm from "../components/BidForm";

export default function PujasPage() {
  const router = useRouter();
  const [showBidForm, setShowBidForm] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem("userToken");
    const wallet = localStorage.getItem("walletAddress");
    
    if (!token || !wallet) {
      router.push("/auth");
      return;
    }

    setUserToken(token);
    setWalletAddress(wallet);
    
    // Check if user is admin
    const adminAddress = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase();
    setIsAdmin(wallet.toLowerCase() === adminAddress);
  }, [router]);

  const handleBidSuccess = () => {
    setShowBidForm(false);
    // La vista se actualizará automáticamente al recargar los datos
  };

  if (!userToken || !walletAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isAdmin ? "⚙️ Manage Auctions" : "🔥 Live Auctions"}
          </h1>
          <p className="text-gray-400">
            {isAdmin 
              ? "Control and monitor active auctions"
              : "Participate in ongoing property auctions"
            }
          </p>
        </div>

        {/* Admin View */}
        {isAdmin ? (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Admin Controls</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => router.push("/house")}
                  className="px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all"
                >
                  🏠 Create House NFT
                </button>
                <button
                  onClick={() => router.push("/admin")}
                  className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all"
                >
                  ⚡ Setup Auction
                </button>
              </div>
            </div>

            {/* Show auction display for admin too */}
            <AuctionDisplay onBidClick={() => setShowBidForm(true)} />
          </div>
        ) : (
        /* Regular User View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Auction Display - 2 columns */}
          <div className="lg:col-span-2">
            <AuctionDisplay onBidClick={() => setShowBidForm(true)} />
          </div>

          {/* Bid Form - 1 column */}
          <div className="lg:col-span-1">
            {showBidForm ? (
              <div className="animate-fade-in">
                <BidForm
                  onSuccess={handleBidSuccess}
                  onCancel={() => setShowBidForm(false)}
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  💰 Realizar Puja
                </h2>
                <p className="text-gray-300 mb-6">
                  Haz clic en el botón para participar en la subasta. Necesitarás USDC en tu wallet.
                </p>
                <button
                  onClick={() => setShowBidForm(true)}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
                >
                  Empezar a Pujar
                </button>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-black/30 rounded-lg border border-white/10">
                  <h3 className="text-sm font-semibold text-white mb-2">ℹ️ Información</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Incremento mínimo: 10% sobre la puja actual</li>
                    <li>• Moneda: USDC (Base Sepolia)</li>
                    <li>• Gas: Pagado automáticamente</li>
                    <li>• Reembolsos: Automáticos al ser superado</li>
                  </ul>
                </div>

                {/* Wallet Info */}
                <div className="mt-4 p-4 bg-black/30 rounded-lg border border-white/10">
                  <h3 className="text-sm font-semibold text-white mb-2">👛 Tu Wallet</h3>
                  <p className="text-xs text-gray-400 font-mono break-all">
                    {walletAddress}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </main>
    </div>
  );
}
