# Skill: Next.js API Route as Web3 Backend Proxy

## What This Covers
Using Next.js App Router API routes as a server-side proxy for Web3 API calls. Protects API keys, validates inputs, and provides a clean action-based interface for the frontend.

## Key Pattern: Action-Based API Route

```typescript
// app/api/endpoints/route.ts
import { NextResponse } from "next/server";

const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY as string;
const CIRCLE_BASE_URL = process.env.NEXT_PUBLIC_CIRCLE_BASE_URL ?? "https://api.circle.com";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Health check
export async function GET() {
  return NextResponse.json({ ok: true, hasApiKey: Boolean(CIRCLE_API_KEY) });
}

// Action dispatcher
export async function POST(request: Request) {
  try {
    if (!CIRCLE_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const { action, ...params } = await request.json();

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    switch (action) {
      case "createDeviceToken": {
        // Validate required params
        const { deviceId } = params;
        if (!deviceId) {
          return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });
        }

        // Forward to external API with server-side auth
        const response = await fetch(`${CIRCLE_BASE_URL}/v1/w3s/users/social/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${CIRCLE_API_KEY}`,
          },
          body: JSON.stringify({
            idempotencyKey: crypto.randomUUID(), // Always use idempotency keys
            deviceId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        // Return only the data payload (strip wrapper)
        return NextResponse.json(data.data, { status: 200 });
      }

      // ... more actions ...

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in /api/endpoints:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## Key Pattern: Frontend Usage

```typescript
// Simple, consistent API call pattern from any component
const response = await fetch("/api/endpoints", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "listWallets",      // Action name
    userToken: "...",            // Action-specific params
  }),
});

const data = await response.json();

if (!response.ok) {
  // Handle error (Circle error codes pass through)
  if (data.code === 155106) {
    // Known error: user already initialized
  }
}
```

## Key Pattern: Forwarding Headers (X-User-Token)

```typescript
case "initializeUser": {
  const response = await fetch(`${CIRCLE_BASE_URL}/v1/w3s/user/initialize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CIRCLE_API_KEY}`,    // Server secret
      "X-User-Token": params.userToken,              // User-specific token forwarded
    },
    body: JSON.stringify({
      idempotencyKey: crypto.randomUUID(),
      accountType: "SCA",
      blockchains: ["BASE-SEPOLIA"],
    }),
  });

  const data = await response.json();
  // Pass through error codes for client-side handling
  if (!response.ok) {
    return NextResponse.json(data, { status: response.status });
  }
  return NextResponse.json(data.data);
}
```

## Key Pattern: Contract Execution via API

```typescript
case "createContractExecutionChallenge": {
  const {
    userToken, walletId, contractAddress,
    abiFunctionSignature, abiParameters, callData, feeLevel,
  } = params;

  const response = await fetch(
    `${CIRCLE_BASE_URL}/v1/w3s/user/transactions/contractExecution`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CIRCLE_API_KEY}`,
        "X-User-Token": userToken,
      },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        walletId,
        contractAddress,
        abiFunctionSignature,  // e.g., "bid(uint256)"
        abiParameters,         // e.g., ["1000000"]
        callData,              // Alternative to ABI approach
        fee: { type: "level", config: { feeLevel: feeLevel ?? "MEDIUM" } },
      }),
    }
  );

  return NextResponse.json((await response.json()).data);
}
```

## Key Pattern: Token Transfer via API

```typescript
case "createTransferChallenge": {
  const { userToken, walletId, destinationAddress, amounts, tokenId, tokenAddress } = params;

  const transferConfig = {
    userToken, walletId, destinationAddress, amounts,
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
  };

  // Support both tokenId (Circle's ID) and tokenAddress (on-chain address)
  if (tokenId) {
    transferConfig.tokenId = tokenId;
  } else if (tokenAddress) {
    transferConfig.tokenAddress = tokenAddress;
  }

  const response = await fetch(
    `${CIRCLE_BASE_URL}/v1/w3s/user/transactions/transfer`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CIRCLE_API_KEY}`,
        "X-User-Token": userToken,
      },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        ...transferConfig,
      }),
    }
  );

  return NextResponse.json((await response.json()).data);
}
```

## Architecture

```
Frontend (Client)                    API Route (Server)              External API
     |                                    |                              |
     |--- POST /api/endpoints ----------->|                              |
     |    { action, params }              |--- Auth + Forward ---------->|
     |                                    |    + CIRCLE_API_KEY          |
     |                                    |<--- Response ---------------|
     |<--- Cleaned Response --------------|                              |
```

## When To Use
- Any Web3 app with server-side API keys (Circle, Alchemy, Infura, etc.)
- Projects needing a clean abstraction between frontend and blockchain APIs
- Apps with multiple external API integrations routed through one endpoint
- Protecting sensitive keys from client-side exposure
