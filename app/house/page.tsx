"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/ui/Header";
import MetadataManager from "@/app/components/admin/MetadataManager";

export default function HousePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const walletAddress = localStorage.getItem("walletAddress");
    if (!walletAddress) {
      router.push("/auth");
      return;
    }

    // Check if user is admin
    const adminAddress = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase();
    setIsAdmin(walletAddress.toLowerCase() === adminAddress);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🏠</span>
            <h1 className="text-3xl font-bold text-white">
              {isAdmin ? "House NFT Registry" : "House Registry"}
            </h1>
          </div>
          <p className="text-gray-400">
            {isAdmin
              ? "Create and manage house NFTs for auctions"
              : "View registered properties and their details"}
          </p>
        </div>

        {/* Content */}
        {isAdmin ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8">
            <MetadataManager />
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏘️</div>
              <h2 className="text-2xl font-bold text-white mb-4">
                House Registry
              </h2>
              <p className="text-gray-400 mb-6">
                View all registered properties available for auction
              </p>
              <div className="text-gray-500">
                Coming soon: Browse and explore property listings
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
