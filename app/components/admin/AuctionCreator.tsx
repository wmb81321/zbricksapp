"use client";

import { useState } from "react";
import { ethers } from "ethers";
import AuctionManagerABI from "@/deployments/abi/AuctionManager.json";

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

const AUCTION_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_AUCTION_MANAGER_ADDRESS || "0xe6afb32fdd1c03edd3dc2f1b0037c3d4580d6dca";

export default function AuctionCreator() {
  const [tokenId, setTokenId] = useState("");
  const [metadataURIs, setMetadataURIs] = useState(["", "", "", ""]);
  const [minBidIncrement, setMinBidIncrement] = useState("1000000"); // 1 USDC
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");

  const updateURI = (index: number, value: string) => {
    const updated = [...metadataURIs];
    updated[index] = value;
    setMetadataURIs(updated);
  };

  const handleCreateAuction = async () => {
    if (!tokenId || metadataURIs.some((uri) => !uri)) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not installed");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        AUCTION_MANAGER_ADDRESS,
        AuctionManagerABI as any,
        signer
      );

      const tx = await contract.createAuction(
        Number(tokenId),
        metadataURIs,
        minBidIncrement
      );

      setTxHash(tx.hash);
      alert(`Transaction sent! Hash: ${tx.hash}`);

      await tx.wait();
      alert("✅ Auction created successfully!");
    } catch (error) {
      console.error("Failed to create auction:", error);
      alert(`Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">⚡ Create New Auction</h2>

      {/* Token ID */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          NFT Token ID
        </label>
        <input
          type="number"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder="e.g., 1"
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          The NFT must be minted and owned by the AuctionManager contract
        </p>
      </div>

      {/* Metadata URIs */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Metadata URIs (Phases 0-3)
        </label>
        <div className="space-y-3">
          {metadataURIs.map((uri, i) => (
            <div key={i}>
              <label className="block text-xs text-gray-500 mb-1">
                Phase {i} ({i === 0 ? "30%" : i === 1 ? "60%" : "100%"} revealed)
              </label>
              <input
                type="text"
                value={uri}
                onChange={(e) => updateURI(i, e.target.value)}
                placeholder="ipfs://... or https://gateway.pinata.cloud/ipfs/..."
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Min Bid Increment */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Minimum Bid Increment (USDC, in smallest units)
        </label>
        <input
          type="number"
          value={minBidIncrement}
          onChange={(e) => setMinBidIncrement(e.target.value)}
          placeholder="1000000 = 1 USDC"
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          USDC has 6 decimals. 1000000 = 1 USDC, 10000000 = 10 USDC
        </p>
      </div>

      {/* Create Button */}
      <button
        onClick={handleCreateAuction}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:opacity-50 text-white font-bold rounded-lg transition-all"
      >
        {loading ? "Creating..." : "🚀 Create Auction"}
      </button>

      {/* Result */}
      {txHash && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-400 font-semibold mb-2">📡 Transaction Sent</p>
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

      {/* Instructions */}
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <p className="text-yellow-400 font-semibold mb-2">⚠️ Prerequisites</p>
        <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
          <li>NFT must be minted with the specified Token ID</li>
          <li>NFT must be transferred to AuctionManager contract</li>
          <li>All 4 metadata URIs must be uploaded to IPFS</li>
          <li>Admin wallet must have ETH for gas fees</li>
          <li>Use MetaMask on Base Sepolia network</li>
        </ul>
      </div>
    </div>
  );
}
