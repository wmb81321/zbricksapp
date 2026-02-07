"use client";

import Header from "../components/ui/Header";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          📚 How It Works
        </h1>

        {/* Step 1 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              1
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Connect Your Wallet
              </h3>
              <p className="text-gray-300 mb-2">
                Login with your Google account. We use Circle Programmable Wallets to create a secure blockchain wallet for you automatically.
              </p>
              <p className="text-gray-400 text-sm">
                ✅ No seed phrases to remember<br />
                ✅ No browser extensions needed<br />
                ✅ Your wallet is secured by Circle's infrastructure
              </p>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              2
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">
                View Live Auction
              </h3>
              <p className="text-gray-300 mb-2">
                Browse the current auction and see partial property details. Each property starts with limited information revealed.
              </p>
              <p className="text-gray-400 text-sm">
                📍 Location and basic details<br />
                🏠 30% of property information revealed<br />
                ⏰ Live countdown timer for the current phase
              </p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              3
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Place Your Bid
              </h3>
              <p className="text-gray-300 mb-2">
                Submit a bid using USDC (testnet). Each bid must be at least 10% higher than the current highest bid.
              </p>
              <p className="text-gray-400 text-sm">
                💰 Step 1: Approve USDC transfer<br />
                🎯 Step 2: Submit your bid<br />
                ⏳ Transactions are processed on Base Sepolia
              </p>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              4
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Progressive Revelation
              </h3>
              <p className="text-gray-300 mb-2">
                As the auction progresses through phases, more property details are revealed automatically.
              </p>
              <p className="text-gray-400 text-sm">
                📊 Phase 0: Location & lot details (30%)<br />
                🏗️ Phase 1: Interior layout & rooms (60%)<br />
                ✨ Phase 2: Complete details & amenities (100%)<br />
                🎉 Phase 3: Final state & winner announced
              </p>
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              5
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Win the Property
              </h3>
              <p className="text-gray-300 mb-2">
                When the auction ends, the highest bidder wins! The property NFT is transferred to the winner's wallet.
              </p>
              <p className="text-gray-400 text-sm">
                🏆 Winner receives the full NFT with all metadata<br />
                📜 Ownership is recorded on the blockchain<br />
                🔐 Transparent and immutable proof of ownership
              </p>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-8 mt-12">
          <h3 className="text-2xl font-bold text-white mb-4">
            🔧 Technical Details
          </h3>
          <div className="space-y-3 text-gray-300">
            <p>
              <strong className="text-white">Blockchain:</strong> Base Sepolia Testnet (Chain ID: 84532)
            </p>
            <p>
              <strong className="text-white">Smart Contracts:</strong> AuctionManager + HouseNFT (ERC-721)
            </p>
            <p>
              <strong className="text-white">Currency:</strong> USDC (6 decimals)
            </p>
            <p>
              <strong className="text-white">Metadata:</strong> Stored on IPFS with progressive revelation
            </p>
            <p>
              <strong className="text-white">Wallets:</strong> Circle Programmable Wallets (Web3 authentication)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
