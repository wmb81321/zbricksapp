# Skill: Two-Step Transaction Pattern (Approve + Execute)

## What This Covers
The ERC-20 approve-then-execute pattern used for any contract that spends tokens on behalf of users. This is the standard pattern for DEXs, auctions, staking, lending, and any protocol interaction involving token transfers.

## Key Pattern: BidForm with Approve + Bid Steps

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Get credentials from storage
  const userToken = sessionStorage.getItem("w3s_user_token") || localStorage.getItem("w3s_user_token");
  const walletId = localStorage.getItem("w3s_wallet_id");

  if (!userToken || !walletId) {
    setError("Wallet not connected.");
    return;
  }

  try {
    setLoading(true);
    setError(null);

    const amount = parseUSDC(bidAmount);

    // Validate minimum
    if (amount < minimumBid) {
      setError(`Bid must be at least ${formatUSDC(minimumBid)}`);
      return;
    }

    // STEP 1: Approve ERC-20 token spending
    setStep("approve");
    setStatus("Approving USDC...");
    await approveUSDC(amount, userToken, walletId);

    // Wait for tx to be mined
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // STEP 2: Execute the actual contract call
    setStep("bid");
    setStatus("Placing bid...");
    await placeBid(amount, userToken, walletId);

    setStatus("Bid successful!");
    setTimeout(() => onSuccess?.(), 2000);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error placing bid";
    setError(message);
    setStep("input"); // Reset to input on error
  } finally {
    setLoading(false);
  }
};
```

## Key Pattern: Step Progress Indicator UI

```tsx
{loading && (
  <div className="flex gap-4">
    <div className={`flex-1 rounded-lg p-3 text-center text-sm ${
      step === "approve"
        ? "bg-[#2DD4D4]/20 text-[#2DD4D4]"   // Active step
        : "bg-white/5 text-white/50"            // Inactive step
    }`}>
      1. Approve USDC
    </div>
    <div className={`flex-1 rounded-lg p-3 text-center text-sm ${
      step === "bid"
        ? "bg-[#2DD4D4]/20 text-[#2DD4D4]"
        : "bg-white/5 text-white/50"
    }`}>
      2. Place Bid
    </div>
  </div>
)}
```

## Key Pattern: Allowance Check Before Execution

```typescript
export async function placeBid(amount: bigint, userToken: string, walletId: string) {
  const signer = await getCircleSigner(userToken, walletId);
  const contract = getAuctionManagerContract(signer);

  // Always check allowance before the contract call
  const usdcContract = getUSDCContract(signer);
  const allowance = await usdcContract.allowance(
    await signer.getAddress(),
    CONTRACTS.AuctionManager.address
  );

  if (BigInt(allowance.toString()) < amount) {
    throw new Error("Insufficient USDC allowance. Please approve USDC first.");
  }

  return await contract.bid(amount);
}
```

## Key Pattern: Currency Input with Formatting

```typescript
const formatCurrency = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) return parts[0] + "." + parts.slice(1).join("");
  if (parts[1] && parts[1].length > 2) return parts[0] + "." + parts[1].slice(0, 2);
  return cleaned;
};

// Input with $ prefix
<div className="relative">
  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-white/50">$</span>
  <input
    type="text"
    value={bidAmount}
    onChange={(e) => setBidAmount(formatCurrency(e.target.value))}
    placeholder="0.00"
    className="w-full py-4 pl-10 pr-4 text-2xl font-semibold ..."
  />
</div>
<p className="mt-2 text-sm text-white/50">
  Minimum bid: {formatUSDC(minimumBid)}
</p>
```

## Key Pattern: Admin Contract Execution (MetaMask Direct)

```typescript
// For admin operations, use MetaMask directly (BrowserProvider)
const handleCreateAuction = async () => {
  if (!window.ethereum) throw new Error("MetaMask not installed");

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  const contract = new ethers.Contract(AUCTION_MANAGER_ADDRESS, ABI, signer);

  const tx = await contract.createAuction(tokenId, metadataURIs, minBidIncrement);
  setTxHash(tx.hash);

  await tx.wait(); // Wait for confirmation
  alert("Auction created!");
};
```

## When To Use
- Any ERC-20 token spend (swap, stake, deposit, bid, purchase)
- DEX interactions (approve token -> swap)
- NFT marketplace (approve USDC -> buy NFT)
- Lending protocols (approve collateral -> supply)
- Admin functions using MetaMask directly
