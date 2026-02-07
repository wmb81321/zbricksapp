"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Simple localStorage check (Circle's recommended approach)
    const userToken = localStorage.getItem("userToken");
    const walletAddress = localStorage.getItem("walletAddress");
    
    if (userToken && walletAddress) {
      setIsAuthenticated(true);
      router.push("/auctions");
    }
  }, [router]);

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        {/* Logo & Title */}
        <div className="mb-12">
          <div className="text-8xl mb-6">🏠</div>
          <h1 className="text-6xl font-bold text-white mb-4">
            ZKBricks
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Continuous Clearing Auctions for Real Estate
          </p>
        </div>

        {/* Intro Section */}
        <div className="mb-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-white mb-6">How It Works</h2>
          <div className="space-y-4 text-left max-w-2xl mx-auto">
            <div className="flex gap-4">
              <div className="text-3xl flex-shrink-0">1️⃣</div>
              <div>
                <h3 className="text-white font-semibold mb-1">Sign In with Google</h3>
                <p className="text-gray-400">We create an international account in USDC</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl flex-shrink-0">2️⃣</div>
              <div>
                <h3 className="text-white font-semibold mb-1">Browse Progressive Auctions</h3>
                <p className="text-gray-400">Property details are revealed in phases that unlocks more information.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl flex-shrink-0">3️⃣</div>
              <div>
                <h3 className="text-white font-semibold mb-1">Place Your Bid</h3>
                <p className="text-gray-400">higher that you go, more likle you get amazing real state</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl flex-shrink-0">4️⃣</div>
              <div>
                <h3 className="text-white font-semibold mb-1">Win the Property</h3>
                <p className="text-gray-400">Highest bidder gets ownership of the property.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sign In Button */}
        <button
          onClick={() => router.push("/auth")}
          className="px-12 py-5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-xl rounded-xl transition-all shadow-2xl shadow-purple-500/50 transform hover:scale-105"
        >
          Sign In with Google
        </button>
      </div>
    </div>
  );
}

