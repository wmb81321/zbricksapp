"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type SvgProps = { className?: string };

const IconTrophy = ({ className = "" }: SvgProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path
      d="M8 4h8v3a4 4 0 0 1-8 0V4Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M6 5H4v2a4 4 0 0 0 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M18 5h2v2a4 4 0 0 1-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path
      d="M10 14h4v3a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-3Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M8 21h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const IconCopy = ({ className = "" }: SvgProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path d="M8 8h10v12H8V8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path
      d="M6 16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const shortAddr = (s: string) => (s.length <= 12 ? s : `${s.slice(0, 6)}…${s.slice(-4)}`);

function cn(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

/**
 * Confetti canvas: ligera y sin librerías.
 */
function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    type Piece = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      rot: number;
      vr: number;
      color: string;
      shape: "rect" | "circle";
      life: number;
    };

    const palette = [
      "#2DD4D4", "#7DEAEA", "#FF4DFF", "#FFD54A", "#7CFF6B", "#FF5A5A", "#5B8CFF", "#FFFFFF",
      "#FF8A00", "#00E5FF",
    ];

    const pieces: Piece[] = [];
    const spawn = (count: number) => {
      for (let i = 0; i < count; i++) {
        const fromLeft = Math.random() < 0.5;
        const x = fromLeft ? -20 : canvas.width + 20;
        const y = Math.random() * canvas.height * 0.8;
        const vx = fromLeft ? 2 + Math.random() * 6 : -(2 + Math.random() * 6);
        const vy = -3 - Math.random() * 6;
        pieces.push({
          x,
          y,
          vx,
          vy,
          size: 4 + Math.random() * 10,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          color: palette[(Math.random() * palette.length) | 0],
          shape: Math.random() < 0.7 ? "rect" : "circle",
          life: 220 + (Math.random() * 120) | 0,
        });
      }
    };

    let tick = 0;

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (active) {
        // bursts al inicio
        if (tick < 40) spawn(18);
        // lluvia constante
        if (tick % 6 === 0) spawn(8);
      }

      // física
      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18; // gravedad
        p.vx *= 0.995;
        p.rot += p.vr;
        p.life -= 1;

        // draw
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 200));
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        const out = p.y > canvas.height + 40 || p.x < -60 || p.x > canvas.width + 60 || p.life <= 0;
        if (out) pieces.splice(i, 1);
      }

      tick++;
      // si no está activo, vaciamos suave
      if (!active && pieces.length > 0 && tick % 2 === 0) pieces.splice(0, Math.min(8, pieces.length));
      if (!active && pieces.length === 0) tick = 0;
    };

    loop();

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "pointer-events-none fixed inset-0 z-[60]",
        active ? "opacity-100" : "opacity-0",
        "transition-opacity duration-300"
      )}
    />
  );
}

export default function WinnerCelebrationView() {
  const data = useMemo(
    () => ({
      property: "Miami Modern House",
      winnerWallet: "0xA1b2c3d4e5f678901234567890abcdef12345678",
      finalBid: 600000,
      currency: "USD",
      cardTitle: "Winner’s Claim",
      cardSubtitle: "Onchain Confirmation NFT",
      // Cambia por tu arte real / render del NFT
      art:
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=2000&q=80",
      rarity: "LEGENDARY",
      explorerUrl: "#",
    }),
    []
  );

  const [mintState, setMintState] = useState<"idle" | "minting" | "minted">("idle");
  const [toast, setToast] = useState("");
  const [celebrating, setCelebrating] = useState(true); // arranca celebrando; cámbialo a false si quieres

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast("Copiado ✅");
      setTimeout(() => setToast(""), 1200);
    } catch {
      setToast("No se pudo copiar");
      setTimeout(() => setToast(""), 1200);
    }
  };

  const mintNow = async () => {
    if (mintState !== "idle") return;

    // En producción: valida wallet conectada == ganador antes de mintear
    setMintState("minting");
    setCelebrating(true);

    // Simulación de tx
    await new Promise((r) => setTimeout(r, 1300));

    setMintState("minted");
    setToast("NFT minteado 🔥");
    setTimeout(() => setToast(""), 1400);

    // Puedes dejar la fiesta unos segundos y bajar
    setTimeout(() => setCelebrating(false), 5000);
  };

  return (
    <div className="min-h-screen bg-[#07090A] text-white overflow-hidden">
      {/* CELEBRACIÓN: flashes + colores tipo casino */}
      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-[10] transition-opacity duration-500",
          celebrating ? "opacity-100" : "opacity-0"
        )}
      >
        {/* rainbow wash */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,212,0.25),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(255,77,255,0.22),transparent_45%),radial-gradient(circle_at_40%_90%,rgba(255,213,74,0.20),transparent_50%),radial-gradient(circle_at_90%_85%,rgba(91,140,255,0.20),transparent_55%)]" />
        {/* strobes */}
        <div className="absolute inset-0 animate-[winnerStrobe_1.2s_linear_infinite] bg-white/0" />
      </div>

      {/* Confetti */}
      <Confetti active={celebrating} />

      {/* Content */}
      <div className="relative z-[20] mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => history.back()}
            className="rounded-full border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
          >
            ← Volver
          </button>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-xs text-white/70">
            <IconTrophy className="h-4 w-4 text-[#7DEAEA]" />
            Ganador confirmado
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-center">
          {/* LEFT: Carta TCG 360 */}
          <div className="flex justify-center">
            <div className="group relative [perspective:1200px]">
              {/* Shadow */}
              <div className="absolute -inset-8 blur-3xl opacity-40 group-hover:opacity-60 transition-opacity"
                   style={{ background: "radial-gradient(circle at 50% 40%, rgba(45,212,212,0.35), transparent 60%)" }}
              />

              {/* CARD */}
              <div
                className={cn(
                  "relative h-[520px] w-[360px] rounded-[22px]",
                  "will-change-transform",
                  celebrating ? "animate-[cardSpin_3.8s_linear_infinite]" : "animate-[cardFloat_2.6s_ease-in-out_infinite]"
                )}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-[22px] overflow-hidden",
                    "border border-[#F6D36B]/55",
                    "bg-[#0B0B0E]",
                    "shadow-[0_30px_90px_rgba(0,0,0,0.65)]"
                  )}
                  style={{ backfaceVisibility: "hidden", transform: "translateZ(2px)" }}
                >
                  {/* Holo foil overlay */}
                  <div className="absolute inset-0 opacity-70 mix-blend-screen">
                    <div className="absolute inset-0 animate-[holo_2.2s_linear_infinite] bg-[conic-gradient(from_180deg,rgba(45,212,212,0.45),rgba(255,77,255,0.35),rgba(255,213,74,0.35),rgba(91,140,255,0.35),rgba(45,212,212,0.45))]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_35%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.10),transparent_40%)]" />
                  </div>

                  {/* Card frame */}
                  <div className="absolute inset-0 p-4">
                    {/* Top title bar */}
                    <div className="rounded-[16px] border border-[#F6D36B]/45 bg-black/55 backdrop-blur px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold tracking-wide text-white/90">
                            {data.cardTitle}
                          </div>
                          <div className="mt-0.5 text-[11px] text-white/60">
                            {data.cardSubtitle}
                          </div>
                        </div>
                        <span className="rounded-full border border-[#2DD4D4]/35 bg-[#0B1516] px-3 py-1 text-[11px] font-semibold text-[#7DEAEA]">
                          {data.rarity}
                        </span>
                      </div>
                    </div>

                    {/* Art box */}
                    <div className="mt-4 rounded-[16px] border border-[#F6D36B]/35 bg-black/45 overflow-hidden">
                      <div className="relative">
                        <img src={data.art} alt="NFT art" className="h-[260px] w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15" />
                        {/* Shine */}
                        <div className="absolute inset-0 opacity-70 mix-blend-screen animate-[shine_1.8s_linear_infinite] bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.35),transparent)]" />
                      </div>
                    </div>

                    {/* Text box */}
                    <div className="mt-4 rounded-[16px] border border-[#F6D36B]/30 bg-black/55 backdrop-blur px-4 py-3">
                      <div className="text-xs text-white/60">Property</div>
                      <div className="mt-1 text-sm font-semibold text-white/90">{data.property}</div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-white/60">
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                          <div>Final bid</div>
                          <div className="mt-0.5 text-white/85 font-semibold">
                            ${data.finalBid.toLocaleString("en-US")}
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                          <div>Network</div>
                          <div className="mt-0.5 text-white/85 font-semibold">Onchain</div>
                        </div>
                      </div>
                    </div>

                    {/* Footer label */}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[11px] text-white/55">
                        Winner: <span className="font-mono text-white/75">{shortAddr(data.winnerWallet)}</span>
                      </span>
                      <span className="text-[11px] text-white/45">TCG-style NFT</span>
                    </div>
                  </div>
                </div>

                {/* Back (para que el giro 360 se vea brutal) */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-[22px] overflow-hidden",
                    "border border-white/10 bg-[#0B0B0E]",
                    "shadow-[0_30px_90px_rgba(0,0,0,0.65)]"
                  )}
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg) translateZ(2px)",
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(45,212,212,0.20),transparent_55%)]" />
                  <div className="absolute inset-0 p-6">
                    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-5">
                      <div className="text-sm font-semibold text-white/90">Winner Proof</div>
                      <div className="mt-2 text-xs text-white/60">
                        Esta cara puede mostrar un QR / hash / metadata del NFT.
                      </div>
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-4">
                        <div className="text-[11px] text-white/55">Winner wallet</div>
                        <div className="mt-1 font-mono text-sm text-white/85 break-all">
                          {data.winnerWallet}
                        </div>
                      </div>
                      <div className="mt-4 h-32 rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(45,212,212,0.12),rgba(255,77,255,0.10),rgba(255,213,74,0.08))]" />
                      <div className="mt-3 text-[11px] text-white/45">
                        (back design)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Caption */}
              <div className="mt-4 text-center text-xs text-white/55">
                {celebrating ? "SPIN MODE: ON 🔥" : "Hover vibes: floating ✨"}
              </div>
            </div>
          </div>

          {/* RIGHT: Actions */}
          <div className="mx-auto w-full max-w-xl">
            <div className="rounded-[28px] border border-white/[0.10] bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
              <div className="flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.03] px-4 py-2 text-xs text-white/70 w-fit">
                <IconTrophy className="h-4 w-4 text-[#7DEAEA]" />
                Resultado final
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight">{data.property}</h1>
              <p className="mt-2 text-sm text-white/55">
                Si esta wallet es la ganadora, puedes mintear el NFT de confirmación.
              </p>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-4">
                <div className="text-xs text-white/55">Ganador</div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-mono text-sm text-white/85">{data.winnerWallet}</div>
                    <div className="mt-1 text-[12px] text-white/55">
                      Wallet: <span className="text-white/75">{shortAddr(data.winnerWallet)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(data.winnerWallet)}
                    className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70 hover:bg-white/[0.06]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <IconCopy className="h-4 w-4" /> Copiar
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                  <div className="text-xs text-white/55">Puja final</div>
                  <div className="mt-1 text-2xl font-semibold text-white/90">
                    ${data.finalBid.toLocaleString("en-US")}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                  <div className="text-xs text-white/55">Moneda</div>
                  <div className="mt-1 text-2xl font-semibold text-white/90">{data.currency}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={mintNow}
                disabled={mintState !== "idle"}
                className={cn(
                  "mt-5 w-full rounded-2xl px-5 py-4 font-semibold text-black transition",
                  mintState === "idle" && "bg-[#2DD4D4] hover:brightness-110",
                  mintState !== "idle" && "bg-white/15 text-white/55 cursor-not-allowed"
                )}
              >
                {mintState === "idle" && "Mint now"}
                {mintState === "minting" && "Minting…"}
                {mintState === "minted" && "Minted ✅"}
              </button>

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCelebrating((v) => !v)}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/70 hover:bg-white/[0.06]"
                >
                  {celebrating ? "Apagar fiesta" : "Encender fiesta"}
                </button>

                <a
                  href={data.explorerUrl}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/70 hover:bg-white/[0.06]"
                >
                  Ver en Explorer ↗
                </a>
              </div>

              <div className="mt-4 text-[11px] text-white/45">
                Pro tip: dispara la celebración cuando la tx esté confirmada (receipt OK). Es puro dopamine UX 😈
              </div>
            </div>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80]">
            <div className="rounded-full border border-white/[0.10] bg-black/70 px-4 py-2 text-xs text-white/80 backdrop-blur">
              {toast}
            </div>
          </div>
        )}
      </div>

      {/* Keyframes */}
      <style jsx global>{`
        @keyframes cardSpin {
          0% { transform: rotateY(0deg) rotateX(10deg); }
          100% { transform: rotateY(360deg) rotateX(10deg); }
        }
        @keyframes cardFloat {
          0% { transform: rotateY(-12deg) rotateX(8deg) translateY(0px); }
          50% { transform: rotateY(12deg) rotateX(10deg) translateY(-10px); }
          100% { transform: rotateY(-12deg) rotateX(8deg) translateY(0px); }
        }
        @keyframes holo {
          0% { filter: hue-rotate(0deg); transform: scale(1.05); }
          100% { filter: hue-rotate(360deg); transform: scale(1.1); }
        }
        @keyframes shine {
          0% { transform: translateX(-60%) translateY(-10%); opacity: 0.0; }
          30% { opacity: 0.55; }
          60% { opacity: 0.15; }
          100% { transform: translateX(60%) translateY(10%); opacity: 0.0; }
        }
        @keyframes winnerStrobe {
          0% { background: rgba(255,255,255,0.0); }
          6% { background: rgba(255,255,255,0.10); }
          12% { background: rgba(255,255,255,0.0); }
          18% { background: rgba(255,255,255,0.06); }
          24% { background: rgba(255,255,255,0.0); }
          100% { background: rgba(255,255,255,0.0); }
        }
      `}</style>
    </div>
  );
}
