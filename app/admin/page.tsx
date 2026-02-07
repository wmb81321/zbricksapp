"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/ui/Header";
import MetadataManager from "@/app/components/admin/MetadataManager";
import AuctionCreator from "@/app/components/admin/AuctionCreator";

type Tab = "mint" | "auction";

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("mint");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    const walletAddress = localStorage.getItem("walletAddress");
    const adminAddress = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase();
    
    if (!walletAddress) {
      router.push("/auth");
      return;
    }

    if (walletAddress.toLowerCase() !== adminAddress) {
      router.push("/pujas");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Verificando permisos...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "mint", label: "Mint House NFT", icon: "🏠" },
    { id: "auction", label: "Create Auction", icon: "⚡" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🔧</span>
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          </div>
          <p className="text-gray-400">
            Mint house NFTs and create auctions
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/50"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8">
          {activeTab === "mint" && <MetadataManager />}
          {activeTab === "auction" && <AuctionCreator />}
        </div>
      </div>
    </div>
  );
}
