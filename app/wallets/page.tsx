// app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";

const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID as string;

type LoginResult = {
  userToken: string;
  encryptionKey: string;
};

type LoginError = {
  code?: number;
  message?: string;
};

type TokenBalanceEntry = {
  amount?: string;
  token?: {
    symbol?: string;
    name?: string;
  };
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

  const [email, setEmail] = useState<string>("");

  const [deviceToken, setDeviceToken] = useState<string>("");
  const [deviceEncryptionKey, setDeviceEncryptionKey] = useState<string>("");
  const [otpToken, setOtpToken] = useState<string>("");

  const [loginResult, setLoginResult] = useState<LoginResult | null>(null);

  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);

  const [status, setStatus] = useState<string>("Ready");
  const [isError, setIsError] = useState<boolean>(false);

  // Initialize SDK on mount
  useEffect(() => {
    let cancelled = false;

    const initSdk = async () => {
      try {
        const onLoginComplete = (
          error?: LoginError | null,
          result?: LoginResult | null,
        ) => {
          if (cancelled) return;

          if (error || !result) {
            const message: string = error?.message || "Email authentication failed.";

            setIsError(true);
            setStatus(message);
            setLoginResult(null);
            return;
          }

          // Success: we get userToken + encryptionKey for challenges
          setLoginResult({
            userToken: result.userToken,
            encryptionKey: result.encryptionKey,
          });
          setIsError(false);
          // Keep this neutral so later wallet-status messages aren't confusing
          setStatus("Email verified. Click Initialize user to continue");
        };

        const sdk = new W3SSdk(
          {
            appSettings: { appId },
          },
          onLoginComplete,
        );

        sdkRef.current = sdk;

        if (!cancelled) {
          setSdkReady(true);
          setIsError(false);
          setStatus("SDK initialized. Ready to request OTP.");
        }
      } catch (err) {
        console.log("Failed to initialize Web SDK:", err);
        if (!cancelled) {
          setIsError(true);
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
        setIsError(true);
        setStatus("Failed to get deviceId");
      } finally {
        setDeviceIdLoading(false);
      }
    };

    if (sdkReady) {
      void fetchDeviceId();
    }
  }, [sdkReady]);

  // Load USDC balance
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
        setIsError(true);
        setStatus("Failed to load USDC balance");
        return null;
      }

      const balances = (data.tokenBalances as TokenBalanceEntry[]) || [];

      const usdcEntry =
        balances.find((t) => {
          const symbol = t.token?.symbol || "";
          const name = t.token?.name || "";
          return symbol.startsWith("USDC") || name.includes("USDC");
        }) ?? null;

      const amount = usdcEntry?.amount ?? "0";
      setUsdcBalance(amount);
      // Note: loadWallets may overwrite this with a more specific status
      setIsError(false);
      setStatus("Wallet details and USDC balance loaded.");
      return amount;
    } catch (err) {
      console.log("Failed to load USDC balance:", err);
      setIsError(true);
      setStatus("Failed to load USDC balance");
      return null;
    }
  }

  // Load wallets for current user
  const loadWallets = async (
    userToken: string,
    options?: { source?: "afterCreate" | "alreadyInitialized" },
  ) => {
    try {
      setIsError(false);
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
        setIsError(true);
        setStatus("Failed to load wallet details");
        return;
      }

      const wallets = (data.wallets as Wallet[]) || [];
      setWallets(wallets);

      if (wallets.length > 0) {
        await loadUsdcBalance(userToken, wallets[0].id);

        if (options?.source === "afterCreate") {
          setIsError(false);
          setStatus(
            "Wallet created successfully! 🎉 Wallet details and USDC balance loaded.",
          );
        } else if (options?.source === "alreadyInitialized") {
          setIsError(false);
          setStatus(
            "User already initialized. Wallet details and USDC balance loaded.",
          );
        }
      } else {
        setIsError(false);
        setStatus("Wallet creation in progress. Click Initialize user again to refresh.");
      }
    } catch (err) {
      console.log("Failed to load wallet details:", err);
      setIsError(true);
      setStatus("Failed to load wallet details");
    }
  };

  const handleRequestOtp = async () => {
    if (!email) {
      setIsError(true);
      setStatus("Please enter an email address.");
      return;
    }

    if (!deviceId) {
      setIsError(true);
      setStatus("Missing deviceId. Try again.");
      return;
    }

    // Reset auth + wallet state
    setLoginResult(null);
    setChallengeId(null);
    setWallets([]);
    setUsdcBalance(null);

    try {
      setIsError(false);
      setStatus("Requesting OTP...");

      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "requestEmailOtp",
          deviceId,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Failed to request OTP:", data);
        setIsError(true);
        setStatus(data.error || data.message || "Failed to request OTP");
        return;
      }

      setDeviceToken(data.deviceToken);
      setDeviceEncryptionKey(data.deviceEncryptionKey);
      setOtpToken(data.otpToken);

      // Give the SDK the session info so verifyOtp() works
      const sdk = sdkRef.current;
      if (sdk) {
        sdk.updateConfigs({
          appSettings: { appId },
          loginConfigs: {
            deviceToken: data.deviceToken,
            deviceEncryptionKey: data.deviceEncryptionKey,
            otpToken: data.otpToken,
            email: { email },
          },
        });
      }

      setIsError(false);
      setStatus(
        "OTP sent! Check your Mailtrap sandbox inbox, then click Verify email OTP.",
      );
    } catch (err) {
      console.log("Error requesting OTP:", err);
      setIsError(true);
      setStatus("Failed to request OTP");
    }
  };

  const handleVerifyOtp = () => {
    const sdk = sdkRef.current;
    if (!sdk) {
      setIsError(true);
      setStatus("SDK not ready");
      return;
    }

    if (!deviceToken || !deviceEncryptionKey || !otpToken) {
      setIsError(true);
      setStatus("Missing OTP session data. Request a new code.");
      return;
    }

    setIsError(false);
    setStatus("Opening OTP verification window...");

    // Opens Circle's hosted OTP UI; on completion, onLoginComplete fires
    sdk.verifyOtp();
  };

  const handleInitializeUser = async () => {
    if (!loginResult?.userToken) {
      setIsError(true);
      setStatus("Missing userToken. Please verify your email first.");
      return;
    }

    try {
      setIsError(false);
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
        if (data.code === 155106) {
          await loadWallets(loginResult.userToken, {
            source: "alreadyInitialized",
          });
          setChallengeId(null);
          return;
        }

        const errorMsg = data.code
          ? `[${data.code}] ${data.error || data.message}`
          : data.error || data.message;
        setIsError(true);
        setStatus("Failed to initialize user: " + errorMsg);
        return;
      }

      setChallengeId(data.challengeId);
      setIsError(false);
      setStatus(`User initialized. Click Create wallet to continue.`);
    } catch (err: unknown) {
      const error = err as LoginError | undefined;
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
      setIsError(true);
      setStatus("Failed to initialize user: " + errorMsg);
    }
  };

  const handleExecuteChallenge = () => {
    const sdk = sdkRef.current;
    if (!sdk) {
      setIsError(true);
      setStatus("SDK not ready");
      return;
    }

    if (!challengeId) {
      setIsError(true);
      setStatus("Missing challengeId. Initialize user first.");
      return;
    }

    if (!loginResult?.userToken || !loginResult?.encryptionKey) {
      setIsError(true);
      setStatus("Missing login credentials. Please verify your email again.");
      return;
    }

    sdk.setAuthentication({
      userToken: loginResult.userToken,
      encryptionKey: loginResult.encryptionKey,
    });

    setIsError(false);
    setStatus("Executing challenge...");

    sdk.execute(challengeId, (error) => {
      if (error) {
        const message =
          typeof error === "object" && error && "message" in error
            ? String((error as LoginError).message)
            : "Unknown error";
        setIsError(true);
        setStatus("Failed to execute challenge: " + message);
        return;
      }

      setIsError(false);
      setStatus("Challenge executed. Loading wallet details...");

      void (async () => {
        // small delay to give Circle time to index the wallet
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setChallengeId(null);
        await loadWallets(loginResult.userToken, { source: "afterCreate" });
      })().catch((e) => {
        console.log("Post-execute loadWallets failed:", e);
        setIsError(true);
        setStatus("Wallet created, but failed to load wallet details.");
      });
    });
  };

  const primaryWallet = wallets[0];

  return (
    <main>
      <div style={{ width: "50%", margin: "0 auto" }}>
        <h1>Create a user wallet with email OTP</h1>
        <p>Enter the email of the user you want to create a wallet for:</p>

        <div style={{ marginBottom: "12px" }}>
          <label>
            Email address:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ marginLeft: "8px", width: "70%" }}
              placeholder="you@example.com"
            />
          </label>
        </div>

        <div>
          <button
            onClick={handleRequestOtp}
            style={{ margin: "6px" }}
            disabled={!sdkReady || !deviceId || deviceIdLoading || !email}
          >
            1. Send email OTP
          </button>
          <br />
          <button
            onClick={handleVerifyOtp}
            style={{ margin: "6px" }}
            disabled={
              !sdkReady || !deviceToken || !deviceEncryptionKey || !otpToken || !!loginResult
            }
          >
            2. Verify email OTP
          </button>
          <br />
          <button
            onClick={handleInitializeUser}
            style={{ margin: "6px" }}
            disabled={!loginResult || !!challengeId || wallets.length > 0}
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
          <strong>Status:</strong>{" "}
          <span style={{ color: isError ? "red" : "black" }}>{status}</span>
        </p>

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
              email,
              deviceToken,
              deviceEncryptionKey,
              otpToken,
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
