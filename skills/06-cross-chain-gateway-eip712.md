# Skill: Cross-Chain Gateway (EIP-712 Burn Intents)

## What This Covers
Circle Gateway cross-chain USDC transfers using EIP-712 typed data signing. Supports transferring USDC between Base Sepolia, Ethereum Sepolia, and Arc Testnet via burn-and-mint intents.

## Key Pattern: Chain Configuration

```typescript
// lib/circle/constants.ts
export type SupportedChainKey = "arc-testnet" | "base-sepolia" | "eth-sepolia";

export const GATEWAY_WALLET_ADDRESS = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";
export const GATEWAY_MINTER_ADDRESS = "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B";
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const CHAINS: Record<SupportedChainKey, {
  label: string;
  domainId: number;
  usdcAddress: string;
}> = {
  "arc-testnet": { label: "Arc Testnet", domainId: 26, usdcAddress: "0x3600000000000000000000000000000000000000" },
  "base-sepolia": { label: "Base Sepolia", domainId: 6, usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" },
  "eth-sepolia": { label: "Ethereum Sepolia", domainId: 0, usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" },
};

// Map Circle wallet blockchain names to chain keys
export const mapWalletBlockchainToChainKey = (blockchain: string): SupportedChainKey | null => {
  const normalized = blockchain.trim().toUpperCase();
  if (normalized.includes("ARC")) return "arc-testnet";
  if (normalized.includes("BASE") && normalized.includes("SEPOLIA")) return "base-sepolia";
  if (normalized.includes("ETH") && normalized.includes("SEPOLIA")) return "eth-sepolia";
  return null;
};
```

## Key Pattern: EVM Hex Utilities

```typescript
// lib/circle/evm.ts
export type Hex = `0x${string}`;
export type Address = Hex;

export const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

export const isAddress = (value: string): value is Address =>
  /^0x[a-fA-F0-9]{40}$/.test(value);

export const toHex = (bytes: Uint8Array): Hex => {
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `0x${hex}`;
};

export const padHex = (value: string, size: number): Hex => {
  const clean = value.startsWith("0x") ? value.slice(2) : value;
  return `0x${clean.padStart(size * 2, "0")}` as Hex;
};

export const parseUnits = (value: string, decimals: number): bigint => {
  const [whole = "0", fraction = ""] = value.trim().split(".");
  if (fraction.length > decimals) throw new Error("Too many decimal places");
  const paddedFraction = fraction.padEnd(decimals, "0");
  return BigInt(`${whole}${paddedFraction}`.replace(/^0+(?=\d)/, "") || "0");
};

export const formatUnits = (value: bigint, decimals: number): string => {
  const negative = value < 0n;
  const absValue = negative ? -value : value;
  const raw = absValue.toString().padStart(decimals + 1, "0");
  const whole = raw.slice(0, -decimals) || "0";
  const fraction = raw.slice(-decimals).replace(/0+$/, "");
  return `${negative ? "-" : ""}${fraction ? `${whole}.${fraction}` : whole}`;
};
```

## Key Pattern: Building EIP-712 Burn Intent

```typescript
// lib/circle/gateway.ts
export type BurnIntentSpec = {
  version: number;
  sourceDomain: number;
  destinationDomain: number;
  sourceContract: Hex;
  destinationContract: Hex;
  sourceToken: Hex;
  destinationToken: Hex;
  sourceDepositor: Hex;
  destinationRecipient: Hex;
  sourceSigner: Hex;
  destinationCaller: Hex;
  value: bigint;
  salt: Hex;
  hookData: Hex;
};

export type BurnIntent = {
  maxBlockHeight: bigint;
  maxFee: bigint;
  spec: BurnIntentSpec;
};

export const buildBurnIntentTypedData = ({
  amount, maxFee, sourceChain, destinationChain,
  sourceDepositor, destinationRecipient, sourceSigner,
  destinationCaller, salt, hookData,
}: BuildBurnIntentParams) => {
  const source = CHAINS[sourceChain];
  const destination = CHAINS[destinationChain];

  const intent: BurnIntent = {
    maxBlockHeight: MAX_UINT256,
    maxFee,
    spec: {
      version: 1,
      sourceDomain: source.domainId,
      destinationDomain: destination.domainId,
      sourceContract: padHex(GATEWAY_WALLET_ADDRESS, 32),
      destinationContract: padHex(GATEWAY_MINTER_ADDRESS, 32),
      sourceToken: padHex(source.usdcAddress, 32),
      destinationToken: padHex(destination.usdcAddress, 32),
      sourceDepositor: padHex(sourceDepositor, 32),
      destinationRecipient: padHex(destinationRecipient, 32),
      sourceSigner: padHex(sourceSigner, 32),
      destinationCaller: padHex(destinationCaller ?? ZERO_ADDRESS, 32),
      value: amount,
      salt: salt ?? randomHex(32),
      hookData: hookData ?? "0x",
    },
  };

  const typedData = {
    domain: { name: "GatewayWallet", version: "1" },
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
      ],
      TransferSpec: [
        { name: "version", type: "uint32" },
        { name: "sourceDomain", type: "uint32" },
        { name: "destinationDomain", type: "uint32" },
        // ... all bytes32 fields
        { name: "value", type: "uint256" },
        { name: "salt", type: "bytes32" },
        { name: "hookData", type: "bytes" },
      ],
      BurnIntent: [
        { name: "maxBlockHeight", type: "uint256" },
        { name: "maxFee", type: "uint256" },
        { name: "spec", type: "TransferSpec" },
      ],
    },
    primaryType: "BurnIntent",
    message: intent,
  };

  return { typedData, burnIntent: intent };
};
```

## Key Pattern: Signing & Submitting via API

```typescript
// 1. Build typed data
const { typedData, burnIntent } = buildBurnIntentTypedData({
  amount: parseUnits("10", 6),  // 10 USDC
  maxFee: parseUnits("1", 6),   // Max 1 USDC fee
  sourceChain: "base-sepolia",
  destinationChain: "eth-sepolia",
  sourceDepositor: walletAddress,
  destinationRecipient: walletAddress,
  sourceSigner: walletAddress,
});

// 2. Sign via Circle (server-side proxy)
const signResponse = await fetch("/api/endpoints", {
  method: "POST",
  body: JSON.stringify({
    action: "signTypedDataChallenge",
    userToken, walletId,
    data: JSON.stringify(typedData),
  }),
});

// 3. Submit to Gateway
const transferResponse = await fetch("/api/endpoints", {
  method: "POST",
  body: JSON.stringify({
    action: "gatewayTransfer",
    burnIntents: [{ burnIntent, signature }],
  }),
});

// 4. Check balances
const balanceResponse = await fetch("/api/endpoints", {
  method: "POST",
  body: JSON.stringify({
    action: "gatewayBalances",
    depositor: walletAddress,
    domains: [6, 0],  // Base Sepolia + Eth Sepolia
    token: "USDC",
  }),
});
```

## When To Use
- Cross-chain USDC transfers (Circle CCTP/Gateway)
- EIP-712 typed data signing for any protocol
- Multi-chain dApps that need asset bridging
- Projects using Circle's cross-chain infrastructure
