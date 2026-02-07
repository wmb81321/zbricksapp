> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Create User Wallets with Social Login

In this quickstart, you build a web app that:

* Lets users authenticate to your app using their Google account.
* Creates a user-owned wallet and connects it to your app.
* Displays the wallet address and the USDC balance it holds.

## Prerequisites

Before you begin, ensure you have:

* A [Circle Developer Console](https://console.circle.com/) account.
* A Circle Developer API key:\
  **Console → Keys → Create a key → API key → Standard Key**.
* A Google account to access the
  [Google Cloud Console](https://console.cloud.google.com/).
* [Node.js 18+](https://nodejs.org/) installed.

## Step 1. Configure the Google Console

In this step, you will set up Google OAuth so users can sign in to your app
using their Google account.

1. Log in to the [Google Cloud Console](https://console.cloud.google.com/)

2. Click **Select a project → New Project**, enter a name (for example, "Social
   Login Test"), and click **Create**.

3. Search for **Auth** in the **Google Cloud Search Bar**.

4. Select **Google Auth Platform**, click **Get started**, and enter:

   * `App name`: for example, "Social Login App"
   * `User support email`: select your email
   * `Audience`: select **External**
   * `Contact email addresses`: type your email again

   Click **Create** after agreeing to the policies.

5. Select **Create OAuth client**, and enter:

   * `Application type`: select **Web application**
   * `Client name`: for example, "Web client 1"
   * `Authorized redirect URIs`: type `http://localhost:3000`

   <Info>
     Users will be redirected to this URL after they log in with their Google
     account.
   </Info>

   Click **Create** to complete the Google OAuth setup.

6. Copy the Google OAuth **Client ID**, which identifies your app with Google's
   OAuth service. You need it for the next two steps.

<Note>
  **Important:** The above Google OAuth setup only allows your account to login
  with Google. If you want other users to authenticate: Select **Audience** from
  your **Google Auth Platform** menu, and click **Publish app**, or add more
  test users individually.
</Note>

## Step 2. Configure the Circle Console

In this step, you connect your Google OAuth client to your Circle Wallets
configuration so users can sign in through your app. You also obtain your App
ID, which identifies your user-controlled wallets configuration in the Circle
Console.

1. Log in to the [Circle Developer Console](https://console.circle.com/).
2. Navigate to **Wallets → User Controlled → Configurator**.
3. Click on **Authentication Methods → Social Logins**, select **Google**.\
   Paste your Google OAuth **Client ID** (from Step 1) into the **Client ID
   (Web)** field.
4. Go to the **Configurator** page and copy your **App ID**. You need it for the
   next step.

## Step 3. Create the web application

In this step, you will create a web app that lets users authenticate using
Google OAuth, and create a blockchain wallet.

### 3.1. Create the Next.js project

In your terminal:

```shell  theme={null}
npx create-next-app@latest circle-social-login --yes
cd circle-social-login
```

### 3.2. Install dependencies

Install the user-controlled wallets Web SDK and supporting packages:

```shell  theme={null}
npm install @circle-fin/w3s-pw-web-sdk cookies-next
```

### 3.3. Add environment variables

Create a `.env.local` file in the project directory:

```shell  theme={null}
touch .env.local
```

Open the `.env.local` file and add the following:

```text .env.local theme={null}
CIRCLE_API_KEY=<YOUR_CIRCLE_API_KEY>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<YOUR_GOOGLE_WEB_CLIENT_ID>
NEXT_PUBLIC_CIRCLE_APP_ID=<YOUR_CIRCLE_APP_ID>
```

* `YOUR_CIRCLE_API_KEY` is your Circle Developer API key.
* `YOUR_GOOGLE_WEB_CLIENT_ID` is the Google OAuth Client ID created in Step 1.
* `YOUR_CIRCLE_APP_ID` is the Circle Wallet App ID obtained in Step 2.

### 3.4. Simplify the default layout

Replace the contents of `app/layout.tsx` with the minimal layout below:

```ts app/layout.tsx twoslash expandable theme={null}
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

<Info>
  Next.js requires an `app/layout.tsx` file, but the default one created by
  `create-next-app` includes fonts and styling that can cause build errors in
  some environments.
</Info>

### 3.5. Add unified backend route

Create a file named `app/api/endpoints/route.ts` and add the code below:

```ts app/api/endpoints/route.ts twoslash expandable theme={null}
// app/api/endpoints/route.ts
import { NextResponse } from "next/server";

const CIRCLE_BASE_URL =
  process.env.NEXT_PUBLIC_CIRCLE_BASE_URL ?? "https://api.circle.com";
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY as string;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...params } = body ?? {};

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    switch (action) {
      case "createDeviceToken": {
        const { deviceId } = params;
        if (!deviceId) {
          return NextResponse.json(
            { error: "Missing deviceId" },
            { status: 400 },
          );
        }

        const response = await fetch(
          `${CIRCLE_BASE_URL}/v1/w3s/users/social/token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${CIRCLE_API_KEY}`,
            },
            body: JSON.stringify({
              idempotencyKey: crypto.randomUUID(),
              deviceId,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        // Returns: { deviceToken, deviceEncryptionKey }
        return NextResponse.json(data.data, { status: 200 });
      }

      case "initializeUser": {
        const { userToken } = params;
        if (!userToken) {
          return NextResponse.json(
            { error: "Missing userToken" },
            { status: 400 },
          );
        }

        const response = await fetch(
          `${CIRCLE_BASE_URL}/v1/w3s/user/initialize`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${CIRCLE_API_KEY}`,
              "X-User-Token": userToken,
            },
            body: JSON.stringify({
              idempotencyKey: crypto.randomUUID(),
              accountType: "SCA",
              blockchains: ["ARC-TESTNET"],
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          // Pass through Circle error payload (e.g. code 155106: user already initialized)
          return NextResponse.json(data, { status: response.status });
        }

        // Returns: { challengeId }
        return NextResponse.json(data.data, { status: 200 });
      }

      case "listWallets": {
        const { userToken } = params;
        if (!userToken) {
          return NextResponse.json(
            { error: "Missing userToken" },
            { status: 400 },
          );
        }

        const response = await fetch(`${CIRCLE_BASE_URL}/v1/w3s/wallets`, {
          method: "GET",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            Authorization: `Bearer ${CIRCLE_API_KEY}`,
            "X-User-Token": userToken,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        // Returns: { wallets: [...] }
        return NextResponse.json(data.data, { status: 200 });
      }

      case "getTokenBalance": {
        const { userToken, walletId } = params;
        if (!userToken || !walletId) {
          return NextResponse.json(
            { error: "Missing userToken or walletId" },
            { status: 400 },
          );
        }

        const response = await fetch(
          `${CIRCLE_BASE_URL}/v1/w3s/wallets/${walletId}/balances`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${CIRCLE_API_KEY}`,
              "X-User-Token": userToken,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        // Returns: { tokenBalances: [...] }
        return NextResponse.json(data.data, { status: 200 });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.log("Error in /api/endpoints:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

This route serves as a single backend entry point for all Circle API endpoints
used by the app, mapping frontend actions to thin wrapper handlers that call the
corresponding endpoints:

| Handler             | Description                                                                                                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createDeviceToken` | calls [POST /v1/w3s/users/social/token](/api-reference/wallets/user-controlled-wallets/create-device-token-social-login) to create a device-bound session used by the Web SDK for social login authentication. |
| `initializeUser`    | calls [POST /v1/w3s/user/initialize](/api-reference/wallets/user-controlled-wallets/create-user-with-pin-challenge) to create or initialize a user and return a `challengeId` required for wallet creation.    |
| `listWallets`       | calls [GET /v1/w3s/wallets](/api-reference/wallets/user-controlled-wallets/list-wallets) to retrieve the wallets associated with the authenticated user.                                                       |
| `getTokenBalance`   | calls [GET /v1/w3s/wallets/{walletId}/balances](/api-reference/wallets/user-controlled-wallets/list-wallet-balance) to retrieve digital asset balances for the specified user-controlled wallet.               |

<Info>
  This quickstart calls `listWallets` and `getTokenBalance` directly for
  simplicity. In production, apps typically store wallet and balance data in a
  backend database and keep it in sync using Circle webhooks for scalability.
</Info>

To understand how the request fields and response data for these handlers and
their corresponding endpoints are used, follow the app flow in
[Step 4](#step-4-run-the-app-flow) below.

### ​3.6. Add UI and frontend code

Replace the contents of `app/page.tsx` with the code below:

```ts app/page.tsx twoslash expandable theme={null}
// app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { setCookie, getCookie } from "cookies-next";
import { SocialLoginProvider } from "@circle-fin/w3s-pw-web-sdk/dist/src/types";
import type { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";

const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID as string;
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string;

type LoginResult = {
  userToken: string;
  encryptionKey: string;
  // other fields (refreshToken, oAuthInfo, etc.) are ignored in this quickstart
};

type Wallet = {
  id: string;
  address: string;
  blockchain: string;
  [key: string]: unknown;
};

export default function HomePage() {
  const sdkRef = useRef<W3SSdk | null>(null);

  const [sdkReady, setSdkReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [deviceIdLoading, setDeviceIdLoading] = useState(false);

  const [deviceToken, setDeviceToken] = useState<string>("");
  const [deviceEncryptionKey, setDeviceEncryptionKey] = useState<string>("");

  const [loginResult, setLoginResult] = useState<LoginResult | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Ready");

  // Initialize SDK on mount, using cookies to restore config after redirect
  useEffect(() => {
    let cancelled = false;

    const initSdk = async () => {
      try {
        const { W3SSdk } = await import("@circle-fin/w3s-pw-web-sdk");

        const onLoginComplete = (error: unknown, result: any) => {
          if (cancelled) return;

          if (error) {
            const err = error as any;
            console.log("Login failed:", err);
            setLoginError(err.message || "Login failed");
            setLoginResult(null);
            setStatus("Login failed");
            return;
          }

          setLoginResult({
            userToken: result.userToken,
            encryptionKey: result.encryptionKey,
          });
          setLoginError(null);
          setStatus("Login successful. Credentials received from Google.");
        };

        const restoredAppId = (getCookie("appId") as string) || appId || "";
        const restoredGoogleClientId =
          (getCookie("google.clientId") as string) || googleClientId || "";
        const restoredDeviceToken = (getCookie("deviceToken") as string) || "";
        const restoredDeviceEncryptionKey =
          (getCookie("deviceEncryptionKey") as string) || "";

        const initialConfig = {
          appSettings: { appId: restoredAppId },
          loginConfigs: {
            deviceToken: restoredDeviceToken,
            deviceEncryptionKey: restoredDeviceEncryptionKey,
            google: {
              clientId: restoredGoogleClientId,
              redirectUri:
                typeof window !== "undefined" ? window.location.origin : "",
              selectAccountPrompt: true,
            },
          },
        };

        const sdk = new W3SSdk(initialConfig, onLoginComplete);
        sdkRef.current = sdk;

        if (!cancelled) {
          setSdkReady(true);
          setStatus("SDK initialized. Ready to create device token.");
        }
      } catch (err) {
        console.log("Failed to initialize Web SDK:", err);
        if (!cancelled) {
          setStatus("Failed to initialize Web SDK");
        }
      }
    };

    void initSdk();

    return () => {
      cancelled = true;
    };
  }, []);

  // Get / cache deviceId
  useEffect(() => {
    const fetchDeviceId = async () => {
      if (!sdkRef.current) return;

      try {
        const cached =
          typeof window !== "undefined"
            ? window.localStorage.getItem("deviceId")
            : null;

        if (cached) {
          setDeviceId(cached);
          return;
        }

        setDeviceIdLoading(true);
        const id = await sdkRef.current.getDeviceId();
        setDeviceId(id);

        if (typeof window !== "undefined") {
          window.localStorage.setItem("deviceId", id);
        }
      } catch (error) {
        console.log("Failed to get deviceId:", error);
        setStatus("Failed to get deviceId");
      } finally {
        setDeviceIdLoading(false);
      }
    };

    if (sdkReady) {
      void fetchDeviceId();
    }
  }, [sdkReady]);

  // Helper to load USDC balance for a wallet
  async function loadUsdcBalance(userToken: string, walletId: string) {
    try {
      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getTokenBalance",
          userToken,
          walletId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Failed to load USDC balance:", data);
        setStatus("Failed to load USDC balance");
        return null;
      }

      const balances = (data.tokenBalances as any[]) || [];

      const usdcEntry =
        balances.find((t) => {
          const symbol = t.token?.symbol || "";
          const name = t.token?.name || "";
          return symbol.startsWith("USDC") || name.includes("USDC");
        }) ?? null;

      const amount = usdcEntry?.amount ?? "0";
      setUsdcBalance(amount);
      return amount;
    } catch (err) {
      console.log("Failed to load USDC balance:", err);
      setStatus("Failed to load USDC balance");
      return null;
    }
  }

  // Helper to load wallets for the current user
  const loadWallets = async (
    userToken: string,
    options?: { source?: "afterCreate" | "alreadyInitialized" },
  ) => {
    try {
      setStatus("Loading wallet details...");
      setUsdcBalance(null);

      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "listWallets",
          userToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("List wallets failed:", data);
        setStatus("Failed to load wallet details");
        return;
      }

      const wallets = (data.wallets as Wallet[]) || [];
      setWallets(wallets);

      if (wallets.length > 0) {
        // Load USDC balance for the primary wallet
        await loadUsdcBalance(userToken, wallets[0].id);

        if (options?.source === "afterCreate") {
          setStatus(
            "Wallet created successfully! 🎉 Wallet details and USDC balance loaded.",
          );
        } else if (options?.source === "alreadyInitialized") {
          setStatus(
            "User already initialized. Wallet details and USDC balance loaded.",
          );
        } else {
          setStatus("Wallet details and USDC balance loaded.");
        }
      } else {
        setStatus("No wallets found for this user.");
      }
    } catch (err) {
      console.log("Failed to load wallet details:", err);
      setStatus("Failed to load wallet details");
    }
  };

  const handleCreateDeviceToken = async () => {
    if (!deviceId) {
      setStatus("Missing deviceId");
      return;
    }

    try {
      setStatus("Creating device token...");
      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createDeviceToken",
          deviceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Create device token failed:", data);
        setStatus("Failed to create device token");
        return;
      }

      setDeviceToken(data.deviceToken);
      setDeviceEncryptionKey(data.deviceEncryptionKey);

      setCookie("deviceToken", data.deviceToken);
      setCookie("deviceEncryptionKey", data.deviceEncryptionKey);

      setStatus("Device token created");
    } catch (err) {
      console.log("Error creating device token:", err);
      setStatus("Failed to create device token");
    }
  };

  const handleLoginWithGoogle = () => {
    const sdk = sdkRef.current;
    if (!sdk) {
      setStatus("SDK not ready");
      return;
    }

    if (!deviceToken || !deviceEncryptionKey) {
      setStatus("Missing deviceToken or deviceEncryptionKey");
      return;
    }

    // Persist configs so SDK can rehydrate after redirect
    setCookie("appId", appId);
    setCookie("google.clientId", googleClientId);
    setCookie("deviceToken", deviceToken);
    setCookie("deviceEncryptionKey", deviceEncryptionKey);

    sdk.updateConfigs({
      appSettings: {
        appId,
      },
      loginConfigs: {
        deviceToken,
        deviceEncryptionKey,
        google: {
          clientId: googleClientId,
          redirectUri: window.location.origin,
          selectAccountPrompt: true,
        },
      },
    });

    setStatus("Redirecting to Google...");
    sdk.performLogin(SocialLoginProvider.GOOGLE);
  };

  const handleInitializeUser = async () => {
    if (!loginResult?.userToken) {
      setStatus("Missing userToken. Please login with Google first.");
      return;
    }

    try {
      setStatus("Initializing user...");

      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initializeUser",
          userToken: loginResult.userToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 155106 = user already initialized
        if (data.code === 155106) {
          // User already initialized; load wallet details instead of trying to create again
          await loadWallets(loginResult.userToken, {
            source: "alreadyInitialized",
          });
          // No challenge to execute when wallet already exists
          setChallengeId(null);
          return;
        }

        const errorMsg = data.code
          ? `[${data.code}] ${data.error || data.message}`
          : data.error || data.message;
        setStatus("Failed to initialize user: " + errorMsg);
        return;
      }

      // Successful initialization → get challengeId
      setChallengeId(data.challengeId);
      setStatus(`User initialized. challengeId: ${data.challengeId}`);
    } catch (err) {
      const error = err as any;

      if (error?.code === 155106 && loginResult?.userToken) {
        await loadWallets(loginResult.userToken, {
          source: "alreadyInitialized",
        });
        setChallengeId(null);
        return;
      }

      const errorMsg = error?.code
        ? `[${error.code}] ${error.message}`
        : error?.message || "Unknown error";
      setStatus("Failed to initialize user: " + errorMsg);
    }
  };

  const handleExecuteChallenge = () => {
    const sdk = sdkRef.current;
    if (!sdk) {
      setStatus("SDK not ready");
      return;
    }

    if (!challengeId) {
      setStatus("Missing challengeId. Initialize user first.");
      return;
    }

    if (!loginResult?.userToken || !loginResult?.encryptionKey) {
      setStatus("Missing login credentials. Please login again.");
      return;
    }

    sdk.setAuthentication({
      userToken: loginResult.userToken,
      encryptionKey: loginResult.encryptionKey,
    });

    setStatus("Executing challenge...");

    sdk.execute(challengeId, (error) => {
      const err = (error || {}) as any;

      if (error) {
        console.log("Execute challenge failed:", err);
        setStatus(
          "Failed to execute challenge: " + (err?.message ?? "Unknown error"),
        );
        return;
      }

      setStatus("Challenge executed. Loading wallet details...");

      void (async () => {
        // small delay to give Circle time to index the wallet
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Challenge consumed; clear it and load wallet details (and balance)
        setChallengeId(null);
        await loadWallets(loginResult.userToken, { source: "afterCreate" });
      })().catch((e) => {
        console.log("Post-execute follow-up failed:", e);
        setStatus("Wallet created, but failed to load wallet details.");
      });
    });
  };

  const primaryWallet = wallets[0];

  return (
    <main>
      <div style={{ width: "50%", margin: "0 auto" }}>
        <h1>Create a user wallet with Google social login</h1>
        <p>Follow the buttons below to complete the flow:</p>

        <div>
          <button
            onClick={handleCreateDeviceToken}
            style={{ margin: "6px" }}
            disabled={!sdkReady || !deviceId || deviceIdLoading}
          >
            1. Create device token
          </button>
          <br />
          <button
            onClick={handleLoginWithGoogle}
            style={{ margin: "6px" }}
            disabled={!deviceToken || !deviceEncryptionKey}
          >
            2. Login with Google
          </button>
          <br />
          <button
            onClick={handleInitializeUser}
            style={{ margin: "6px" }}
            disabled={!loginResult || wallets.length > 0}
          >
            3. Initialize user (get challenge)
          </button>
          <br />
          <button
            onClick={handleExecuteChallenge}
            style={{ margin: "6px" }}
            disabled={!challengeId || wallets.length > 0}
          >
            4. Create wallet (execute challenge)
          </button>
        </div>

        <p>
          <strong>Status:</strong> {status}
        </p>

        {loginError && (
          <p style={{ color: "red" }}>
            <strong>Error:</strong> {loginError}
          </p>
        )}

        {primaryWallet && (
          <div style={{ marginTop: "12px" }}>
            <h2>Wallet details</h2>
            <p>
              <strong>Address:</strong> {primaryWallet.address}
            </p>
            <p>
              <strong>Blockchain:</strong> {primaryWallet.blockchain}
            </p>
            {usdcBalance !== null && (
              <p>
                <strong>USDC balance:</strong> {usdcBalance}
              </p>
            )}
          </div>
        )}

        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            lineHeight: "1.8",
            marginTop: "16px",
          }}
        >
          {JSON.stringify(
            {
              deviceId,
              deviceToken,
              deviceEncryptionKey,
              userToken: loginResult?.userToken,
              encryptionKey: loginResult?.encryptionKey,
              challengeId,
              wallets,
              usdcBalance,
            },
            null,
            2,
          )}
        </pre>
      </div>
    </main>
  );
}
```

This page renders the UI and implements all browser-side logic for the Google
social login and wallet creation flow. It initializes the Web SDK, processes the
Google OAuth redirect, manages short-lived state across redirects, and
coordinates the sequence of actions required to create and display the wallet.

## Step 4. Run the app flow

1. Start the dev server:

```shell  theme={null}
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

3) Complete the Google authentication and wallet creation flow:
   1. Click **Create device token**: The Web SDK generates a unique `deviceId`,
      which identifies the user's browser. Your backend exchanges the `deviceId`
      for temporary verification tokens (`deviceToken`, `deviceEncryptionKey`)
      used by the Web SDK to allow Google authentication.
   2. Click **Login with Google**: The Web SDK starts the Google OAuth
      authentication process. After the user signs in with Google, the SDK sends
      the OAuth result to Circle. Circle validates the login and returns a
      `userToken` and `encryptionKey`, which together represent an authenticated
      Circle user session.
   3. Click **Initialize user**: Your backend initializes the user using the
      `userToken`. If the user hasn't created a wallet yet, Circle returns a
      `challengeId` to create one. If the user is already initialized, the app
      loads the existing wallet instead.
   4. Click **Create wallet**: The Web SDK executes the challenge using the
      `challengeId`. The user approves the action, and Circle creates the
      wallet.

4) Once the flow completes:
   * The app displays the wallet address, blockchain, and USDC balance.
   * You can verify the user was created in the
     [Circle Dev Console](https://console.circle.com/):\
     **Wallets → User Controlled → Users**.

## Step 5. Fund the wallet

In this step, you fund the new wallet manually using the Circle Faucet and
confirm the updated balance in the app.

1. Copy the wallet address (`0x...`) from the web app UI.
2. Visit the official [Circle Faucet](https://faucet.circle.com/).
3. Select **Arc Testnet** as the blockchain network.
4. Paste the wallet address in the **Send to** field.
5. Click **Send USDC**.
6. Return to the app and walk through the flow again.\
   **Note:** Use the same Google account to show the same wallet.
7. The app will display the updated USDC balance.

<Note>
  In this step, you're acting as the end user to fund your user-controlled
  wallet for testing. In production, app developers don't control user wallets
  or private keys. Instead, users typically fund wallets themselves, but apps
  may also fund using faucets or airdrops without requiring wallet access.
</Note>
