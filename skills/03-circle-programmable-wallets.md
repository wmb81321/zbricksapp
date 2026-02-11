# Skill: Circle Programmable Wallets (Social Login + Gasless)

## What This Covers
Full integration of Circle Programmable Wallets with Google OAuth social login. Creates custodial wallets for users without MetaMask. Handles device tokens, challenges, wallet creation, and credential persistence.

## Key Pattern: SDK Initialization

```typescript
// Dynamic import (client-side only, Next.js compatible)
const { W3SSdk } = await import("@circle-fin/w3s-pw-web-sdk");
import { SocialLoginProvider } from "@circle-fin/w3s-pw-web-sdk/dist/src/types";

const sdk = new W3SSdk(
  {
    appSettings: { appId: process.env.NEXT_PUBLIC_CIRCLE_APP_ID },
    loginConfigs: {
      deviceToken: restoredDeviceToken,
      deviceEncryptionKey: restoredDeviceEncryptionKey,
      google: {
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        redirectUri: window.location.origin,
        selectAccountPrompt: true,
      },
    },
  },
  onLoginComplete  // Callback for when login finishes (after redirect)
);
```

## Key Pattern: Full Authentication Flow

```
Step 1: Get Device ID
  sdk.getDeviceId() -> cache in localStorage

Step 2: Create Device Token (server-side via API route)
  POST /api/endpoints { action: "createDeviceToken", deviceId }
  -> returns { deviceToken, deviceEncryptionKey }
  -> store in cookies (survive OAuth redirect)

Step 3: Google Social Login (redirects to Google)
  sdk.updateConfigs({ loginConfigs: { deviceToken, deviceEncryptionKey, google: {...} } })
  sdk.performLogin(SocialLoginProvider.GOOGLE)
  -> redirects to Google -> redirects back with tokens

Step 4: Login Callback fires
  onLoginComplete(error, result) -> { userToken, encryptionKey }

Step 5: Initialize User (creates wallet if new)
  POST /api/endpoints { action: "initializeUser", userToken }
  -> returns { challengeId } for new users
  -> returns error code 155106 for existing users (skip to Step 7)

Step 6: Execute Challenge (new users only)
  sdk.setAuthentication({ userToken, encryptionKey })
  sdk.execute(challengeId, callback)
  -> creates wallet on-chain

Step 7: Load Wallets
  POST /api/endpoints { action: "listWallets", userToken }
  -> returns { wallets: [{ id, address, blockchain }] }

Step 8: Store Credentials
  localStorage.setItem("userToken", ...)
  localStorage.setItem("encryptionKey", ...)
  localStorage.setItem("walletId", wallets[0].id)
  localStorage.setItem("walletAddress", wallets[0].address)
```

## Key Pattern: Cookie Persistence for OAuth Redirect

```typescript
import { setCookie, getCookie } from "cookies-next";

// Before redirect (configs survive the Google OAuth redirect)
setCookie("appId", appId);
setCookie("google.clientId", googleClientId);
setCookie("deviceToken", currentDeviceToken);
setCookie("deviceEncryptionKey", currentDeviceEncryptionKey);

// After redirect (restore in SDK init)
const restoredDeviceToken = getCookie("deviceToken") as string || "";
const restoredDeviceEncryptionKey = getCookie("deviceEncryptionKey") as string || "";
```

## Key Pattern: Server-Side API Proxy (Next.js Route)

```typescript
// app/api/endpoints/route.ts
// Protects CIRCLE_API_KEY on server side

export async function POST(request: Request) {
  const { action, ...params } = await request.json();

  switch (action) {
    case "createDeviceToken": {
      const response = await fetch(`${CIRCLE_BASE_URL}/v1/w3s/users/social/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CIRCLE_API_KEY}`,
        },
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          deviceId: params.deviceId,
        }),
      });
      return NextResponse.json((await response.json()).data);
    }

    case "initializeUser": {
      const response = await fetch(`${CIRCLE_BASE_URL}/v1/w3s/user/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CIRCLE_API_KEY}`,
          "X-User-Token": params.userToken,
        },
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          accountType: "SCA",
          blockchains: ["BASE-SEPOLIA"],
        }),
      });
      // Handle error code 155106 = user already initialized
      return NextResponse.json((await response.json()).data);
    }

    case "listWallets": {
      const response = await fetch(`${CIRCLE_BASE_URL}/v1/w3s/wallets`, {
        headers: {
          Authorization: `Bearer ${CIRCLE_API_KEY}`,
          "X-User-Token": params.userToken,
        },
      });
      return NextResponse.json((await response.json()).data);
    }

    case "getTokenBalance": {
      // GET /v1/w3s/wallets/{walletId}/balances
    }

    case "createTransferChallenge": {
      // POST /v1/w3s/user/transactions/transfer
    }

    case "createContractExecutionChallenge": {
      // POST /v1/w3s/user/transactions/contractExecution
      // For calling smart contract functions via Circle
    }

    case "signTypedDataChallenge": {
      // POST /v1/w3s/user/sign/typedData
      // For EIP-712 typed data signing
    }
  }
}
```

## Key Pattern: Custom Signer (Bridge between ethers.js and Circle)

```typescript
// Custom signer that wraps Circle wallet for ethers.js compatibility
class CircleSigner extends ethers.AbstractSigner {
  readonly address: string;

  constructor(address: string, provider: ethers.Provider) {
    super(provider);
    this.address = address;
  }

  async getAddress(): Promise<string> {
    return this.address;
  }

  async signTransaction(): Promise<string> {
    throw new Error("Use Circle SDK for transaction signing");
  }

  async signMessage(): Promise<string> {
    throw new Error("Use Circle SDK for message signing");
  }

  async signTypedData(): Promise<string> {
    throw new Error("Use Circle SDK for typed data signing");
  }

  connect(provider: ethers.Provider): ethers.Signer {
    return new CircleSigner(this.address, provider);
  }
}

export async function getCircleSigner(userToken: string, walletId: string): Promise<ethers.Signer> {
  const provider = getProvider();
  const walletAddress = localStorage.getItem("w3s_wallet_address");
  return new CircleSigner(walletAddress!, provider);
}
```

## Key Pattern: Checking Wallet Connection

```typescript
export function useWalletCredentials() {
  const [credentials, setCredentials] = useState({
    userToken: null, walletId: null, walletAddress: null,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userToken = sessionStorage.getItem("w3s_user_token") || localStorage.getItem("w3s_user_token");
      const walletId = localStorage.getItem("w3s_wallet_id");
      const walletAddress = localStorage.getItem("w3s_wallet_address");
      setCredentials({ userToken, walletId, walletAddress });
    }
  }, []);

  const isConnected = !!(credentials.userToken && credentials.walletId);
  return { ...credentials, isConnected };
}
```

## Environment Variables

```env
CIRCLE_API_KEY=TEST_API_KEY:xxx           # Server-side only
NEXT_PUBLIC_CIRCLE_APP_ID=xxx             # Client-side
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
NEXT_PUBLIC_CIRCLE_BASE_URL=https://api.circle.com
```

## When To Use
- Apps where users should NOT need MetaMask or any wallet extension
- Social login onboarding (Google, Apple, etc.)
- Gasless/sponsored transactions
- Mobile-first Web3 apps
- Apps targeting non-crypto-native users
