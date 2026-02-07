"use client";

import { useEffect, useRef, useState } from "react";
import { setCookie, getCookie } from "cookies-next";
import { SocialLoginProvider } from "@circle-fin/w3s-pw-web-sdk/dist/src/types";
import type { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";
import { useRouter } from "next/navigation";

const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID as string;
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string;

type LoginResult = {
  userToken: string;
  encryptionKey: string;
};

type Wallet = {
  id: string;
  address: string;
  blockchain: string;
  [key: string]: unknown;
};

export default function AuthPage() {
  const router = useRouter();
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
  const [status, setStatus] = useState<string>("Inicializando...");
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize SDK on mount
  useEffect(() => {
    let cancelled = false;

    const initSdk = async () => {
      try {
        const { W3SSdk } = await import("@circle-fin/w3s-pw-web-sdk");

        const onLoginComplete = (error: unknown, result: any) => {
          if (cancelled) return;

          if (error) {
            const err = error as any;
            console.error("Login failed:", err);
            setLoginError(err.message || "Login failed");
            setLoginResult(null);
            setStatus("Login fallido");
            setIsProcessing(false);
            return;
          }

          console.log("✅ Login successful:", result);
          setLoginResult({
            userToken: result.userToken,
            encryptionKey: result.encryptionKey,
          });
          setLoginError(null);
          setStatus("Login exitoso. Inicializando usuario...");
        };

        // Restore configs from cookies (after Google redirect)
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
                typeof window !== "undefined" ? window.location.origin + "/auth" : "",
              selectAccountPrompt: true,
            },
          },
        };

        const sdk = new W3SSdk(initialConfig, onLoginComplete);
        sdkRef.current = sdk;

        if (!cancelled) {
          setSdkReady(true);
          setStatus("SDK inicializado");
        }
      } catch (err) {
        console.error("Failed to initialize Web SDK:", err);
        if (!cancelled) {
          setStatus("Error al inicializar SDK");
        }
      }
    };

    void initSdk();

    return () => {
      cancelled = true;
    };
  }, []);

  // Get deviceId
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
          setStatus("Listo para iniciar sesión");
          return;
        }

        setDeviceIdLoading(true);
        const id = await sdkRef.current.getDeviceId();
        setDeviceId(id);

        if (typeof window !== "undefined") {
          window.localStorage.setItem("deviceId", id);
        }
        setStatus("Listo para iniciar sesión");
      } catch (error) {
        console.error("Failed to get deviceId:", error);
        setStatus("Error al obtener deviceId");
      } finally {
        setDeviceIdLoading(false);
      }
    };

    if (sdkReady) {
      void fetchDeviceId();
    }
  }, [sdkReady]);

  // Handle complete auth flow after login
  useEffect(() => {
    if (!loginResult?.userToken) return;
    if (isProcessing) return;

    const handleCompleteAuthFlow = async () => {
      setIsProcessing(true);
      try {
        // Step 1: Initialize user
        await handleInitializeUser();
      } catch (err) {
        console.error("Auth flow error:", err);
        setIsProcessing(false);
      }
    };

    void handleCompleteAuthFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginResult]);

  const handleCreateDeviceToken = async () => {
    if (!deviceId) {
      setStatus("Esperando deviceId...");
      return;
    }

    try {
      setStatus("Creando device token...");
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
        console.error("Create device token failed:", data);
        setStatus("Error al crear device token");
        return false;
      }

      setDeviceToken(data.deviceToken);
      setDeviceEncryptionKey(data.deviceEncryptionKey);

      setCookie("deviceToken", data.deviceToken);
      setCookie("deviceEncryptionKey", data.deviceEncryptionKey);

      setStatus("Device token creado");
      return true;
    } catch (err) {
      console.error("Error creating device token:", err);
      setStatus("Error al crear device token");
      return false;
    }
  };

  const handleLoginWithGoogle = async () => {
    const sdk = sdkRef.current;
    if (!sdk) {
      setStatus("SDK no está listo");
      return;
    }

    setIsProcessing(true);

    // Create device token first if not exists
    if (!deviceToken || !deviceEncryptionKey) {
      const success = await handleCreateDeviceToken();
      if (!success) {
        setIsProcessing(false);
        return;
      }
      // Wait for state to update
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Use current state or get from cookies
    const currentDeviceToken = deviceToken || (getCookie("deviceToken") as string);
    const currentDeviceEncryptionKey =
      deviceEncryptionKey || (getCookie("deviceEncryptionKey") as string);

    if (!currentDeviceToken || !currentDeviceEncryptionKey) {
      setStatus("Falta device token. Intenta de nuevo.");
      setIsProcessing(false);
      return;
    }

    // Persist configs for after redirect
    setCookie("appId", appId);
    setCookie("google.clientId", googleClientId);
    setCookie("deviceToken", currentDeviceToken);
    setCookie("deviceEncryptionKey", currentDeviceEncryptionKey);

    sdk.updateConfigs({
      appSettings: {
        appId,
      },
      loginConfigs: {
        deviceToken: currentDeviceToken,
        deviceEncryptionKey: currentDeviceEncryptionKey,
        google: {
          clientId: googleClientId,
          redirectUri: window.location.origin + "/auth",
          selectAccountPrompt: true,
        },
      },
    });

    setStatus("Redirigiendo a Google...");
    sdk.performLogin(SocialLoginProvider.GOOGLE);
  };

  const handleInitializeUser = async () => {
    if (!loginResult?.userToken) {
      setStatus("Falta userToken");
      return;
    }

    try {
      setStatus("Inicializando usuario...");
      console.log("🔄 Initializing user with token:", loginResult.userToken.substring(0, 10) + "...");

      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initializeUser",
          userToken: loginResult.userToken,
        }),
      });

      const data = await response.json();
      console.log("📥 Initialize response:", data);

      if (!response.ok) {
        // 155106 = user already initialized
        if (data.code === 155106) {
          console.log("✅ Usuario ya inicializado, cargando wallets...");
          setStatus("Usuario ya existe. Cargando wallet...");
          await loadWalletsAndRedirect(loginResult.userToken);
          return;
        }

        const errorMsg = data.code
          ? `[${data.code}] ${data.error || data.message}`
          : data.error || data.message;
        console.error("❌ Initialize error:", errorMsg);
        setStatus("Error al inicializar: " + errorMsg);
        setIsProcessing(false);
        return;
      }

      // New user → got challengeId for initialization (wallet created automatically)
      console.log("✅ Usuario inicializado, challengeId:", data.challengeId);
      setStatus(`Creando wallet...`);
      
      // Execute the initialization challenge (creates wallet)
      await executeChallenge(data.challengeId);
      
      // Wait for Circle to index the wallet
      console.log("⏳ Waiting for Circle to index wallet...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Load wallet and redirect
      await loadWalletsAndRedirect(loginResult.userToken);
    } catch (err) {
      console.error("❌ Error initializing user:", err);
      setStatus("Error al inicializar usuario");
      setIsProcessing(false);
    }
  };

  const executeChallenge = async (challengeId: string) => {
    const sdk = sdkRef.current;
    if (!sdk) {
      setStatus("SDK no está listo");
      throw new Error("SDK not ready");
    }

    if (!loginResult?.userToken || !loginResult?.encryptionKey) {
      setStatus("Falta credenciales de login");
      throw new Error("Missing credentials");
    }

    console.log("🔄 Setting authentication and executing challenge:", challengeId);
    sdk.setAuthentication({
      userToken: loginResult.userToken,
      encryptionKey: loginResult.encryptionKey,
    });

    return new Promise<void>((resolve, reject) => {
      sdk.execute(challengeId, (error) => {
        if (error) {
          const err = error as any;
          console.error("❌ Execute challenge failed:", err);
          setStatus("Error al ejecutar challenge: " + (err?.message ?? "Error desconocido"));
          reject(err);
        } else {
          console.log("✅ Challenge executed successfully");
          resolve();
        }
      });
    });
  };

  const loadWalletsAndRedirect = async (userToken: string) => {
    try {
      console.log("🔄 Loading wallets for user...");
      setStatus("Cargando wallets...");
      
      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "listWallets",
          userToken,
        }),
      });

      const data = await response.json();
      console.log("📥 Wallets response:", data);

      if (!response.ok) {
        console.error("❌ List wallets failed:", data);
        setStatus("Error al cargar wallets");
        setIsProcessing(false);
        return;
      }

      const wallets = (data.wallets as Wallet[]) || [];
      console.log("✅ Wallets loaded:", wallets);

      if (wallets.length > 0) {
        console.log("✅ Wallet found:", wallets[0].address);
        setWallets(wallets);
        
        // Save to localStorage (Circle's Web SDK approach)
        localStorage.setItem("userToken", loginResult!.userToken);
        localStorage.setItem("encryptionKey", loginResult!.encryptionKey);
        localStorage.setItem("walletId", wallets[0].id);
        localStorage.setItem("walletAddress", wallets[0].address);
        localStorage.setItem("userId", wallets[0].userId || wallets[0].id);
        
        console.log("✅ Saved to localStorage, redirecting...");
        setStatus("✅ Success! Redirecting...");
        
        // Immediate redirect
        router.push("/auctions");
      } else {
        console.warn("⚠️ No wallets found for user");
        setStatus("Error: No wallet found");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("❌ Failed to load wallets:", err);
      setStatus("Error al cargar wallets");
      setIsProcessing(false);
    }
  };

  const primaryWallet = wallets[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🏠 ZKBricks</h1>
          <p className="text-gray-300">Subasta Descentralizada</p>
        </div>

        {/* Status */}
        <div className="mb-6 p-4 bg-black/30 rounded-lg border border-white/10">
          <p className="text-sm text-gray-300">
            <strong className="text-white">Estado:</strong> {status}
          </p>
          {loginError && (
            <p className="text-sm text-red-400 mt-2">
              <strong>Error:</strong> {loginError}
            </p>
          )}
        </div>

        {/* Login Button */}
        {!loginResult && !isProcessing && (
          <button
            onClick={handleLoginWithGoogle}
            disabled={!sdkReady || !deviceId || deviceIdLoading}
            className="w-full py-4 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Iniciar Sesión con Google
          </button>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-purple-500 mb-4"></div>
            <p className="text-gray-300">Procesando...</p>
          </div>
        )}

        {/* Wallet Created */}
        {primaryWallet && (
          <div className="mt-6 p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg">
            <h3 className="text-white font-semibold mb-2">✅ Wallet Creada</h3>
            <p className="text-sm text-gray-300 break-all">
              {primaryWallet.address}
            </p>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Powered by Circle Programmable Wallets
          </p>
        </div>
      </div>
    </div>
  );
}
