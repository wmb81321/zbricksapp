"use client";

import Link from "next/link";

/* =========================
   Helpers
========================= */

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function downloadICS(opts: {
  title: string;
  description?: string;
  startUtc: Date;
  endUtc: Date;
}) {
  const toICSDate = (d: Date) =>
    d.getUTCFullYear() +
    pad2(d.getUTCMonth() + 1) +
    pad2(d.getUTCDate()) +
    "T" +
    pad2(d.getUTCHours()) +
    pad2(d.getUTCMinutes()) +
    pad2(d.getUTCSeconds()) +
    "Z";

  const uid = `${crypto.randomUUID()}@subastas`;
  const dtstamp = toICSDate(new Date());

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Subastas//Landing//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${toICSDate(opts.startUtc)}`,
    `DTEND:${toICSDate(opts.endUtc)}`,
    `SUMMARY:${opts.title}`,
    `DESCRIPTION:${opts.description || ""}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "recordatorio-subastas.ics";
  a.click();
  URL.revokeObjectURL(url);
}

/* =========================
   Semanas de Marzo
========================= */

type MarchWeek = {
  week: number;
  start: number;
  end: number;
  startDate: Date;
  endDate: Date;
};

function getMarchWeeks(year: number): MarchWeek[] {
  return [
    { week: 1, start: 1, end: 7 },
    { week: 2, start: 8, end: 14 },
    { week: 3, start: 15, end: 21 },
    { week: 4, start: 22, end: 28 },
    { week: 5, start: 29, end: 31 },
  ].map((w) => ({
    ...w,
    startDate: new Date(Date.UTC(year, 2, w.start, 0, 0, 0)),
    endDate: new Date(Date.UTC(year, 2, w.end, 23, 59, 59)),
  }));
}

/* =========================
   Página
========================= */

export default function LandingSubastas() {
  const YEAR = 2026;
  const weeks = getMarchWeeks(YEAR);

  const now = new Date();
  const todayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const currentWeekIndex = weeks.findIndex(
    (w) => todayUTC >= w.startDate && todayUTC <= w.endDate
  );

  const handleReminder = () => {
    const startUtc = new Date(Date.UTC(YEAR, 2, 1, 14, 0, 0)); // 9am Colombia
    const endUtc = new Date(Date.UTC(YEAR, 2, 1, 14, 15, 0));

    downloadICS({
      title: "Subastas inmobiliarias",
      description:
        "Cada semana se desbloquea una nueva propiedad. Revisa el marketplace.",
      startUtc,
      endUtc,
    });
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "black",
        color: "white",
        padding: "3rem 1rem",
      }}
    >
      {/* Animaciones */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        @keyframes pulse {
          0% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.9;
          }
          100% {
            opacity: 0.4;
          }
        }
      `}</style>

      <div style={{ maxWidth: 980, margin: "0 auto", textAlign: "center" }}>
        {/* TÍTULO */}
        <h1 style={{ fontSize: "2.6rem", color: "#67e8f9" }}>
          Subastas Inmobiliarias Semanales
        </h1>

        {/* 🔥 TU FRASE (NO SE TOCA) */}
        <p style={{ marginTop: 18, fontSize: "1.1rem", color: "#cfcfcf" }}>
          Cada semana desbloqueamos una nueva propiedad. Participa, puja y gana en tiempo real.
        </p>

        {/* BOTONES */}
        <div
          style={{
            marginTop: 28,
            display: "flex",
            gap: 14,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/marketplace"
            style={{
              padding: "12px 26px",
              borderRadius: 999,
              border: "1px solid #67e8f9",
              color: "#67e8f9",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Ver Subastas Activas →
          </Link>

          <button
            onClick={handleReminder}
            style={{
              padding: "12px 20px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.08)",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            🔔 Agregar recordatorio
          </button>
        </div>

        {/* GRID SEMANAS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1rem",
            marginTop: "3rem",
          }}
        >
          {weeks.map((w, i) => {
            const isPast = currentWeekIndex !== -1 && i < currentWeekIndex;
            const isCurrent = i === currentWeekIndex;
            const isFuture = currentWeekIndex === -1 || i > currentWeekIndex;

            return (
              <div
                key={w.week}
                style={{
                  borderRadius: 14,
                  padding: 22,
                  minHeight: 170,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: isCurrent
                    ? "linear-gradient(110deg, #0f172a 40%, #1e293b 50%, #0f172a 60%)"
                    : "rgba(255,255,255,0.05)",
                  backgroundSize: isCurrent ? "200% 100%" : "auto",
                  animation: isCurrent ? "shimmer 1.6s infinite" : "none",
                }}
              >
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: isPast
                      ? "#86efac"
                      : isCurrent
                      ? "#fde68a"
                      : "#67e8f9",
                  }}
                >
                  Semana {w.week}
                </h3>

                <p style={{ marginTop: 6, fontSize: 14, color: "#aaa" }}>
                  Del {w.start} al {w.end} de marzo {YEAR}
                </p>

                <div
                  style={{
                    marginTop: 18,
                    height: 10,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.15)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: isPast ? "100%" : isCurrent ? "60%" : "30%",
                      height: "100%",
                      background: "rgba(255,255,255,0.35)",
                      animation: isCurrent ? "pulse 1.2s infinite" : "none",
                    }}
                  />
                </div>

                <div style={{ marginTop: 14, fontWeight: 800 }}>
                  {isPast && (
                    <span style={{ color: "#86efac" }}>✅ Disponible</span>
                  )}
                  {isCurrent && (
                    <span style={{ color: "#fde68a" }}>
                      ⏳ Cargando propiedades…
                    </span>
                  )}
                  {isFuture && (
                    <span style={{ color: "#67e8f9" }}>🔒 Próximamente</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
