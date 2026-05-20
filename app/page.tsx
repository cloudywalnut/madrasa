"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen pattern-bg flex flex-col items-center justify-center relative overflow-hidden">
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(27,46,107,0.55) 0%, transparent 70%)",
        }}
      />

      {/* Decorative corner ornaments */}
      <div className="absolute top-6 left-6 opacity-30 text-4xl select-none" style={{ color: "var(--color-gold)" }}>✦</div>
      <div className="absolute top-6 right-6 opacity-30 text-4xl select-none" style={{ color: "var(--color-gold)" }}>✦</div>
      <div className="absolute bottom-6 left-6 opacity-20 text-3xl select-none" style={{ color: "var(--color-gold)" }}>✦</div>
      <div className="absolute bottom-6 right-6 opacity-20 text-3xl select-none" style={{ color: "var(--color-gold)" }}>✦</div>

      {/* Portal card */}
      <div
        className="relative z-10 w-full max-w-lg mx-4 animate-scale-in"
        style={{
          background:
            "linear-gradient(160deg, rgba(27,46,107,0.92) 0%, rgba(10,22,40,0.97) 100%)",
          border: "1px solid rgba(200,150,30,0.35)",
          borderRadius: "1.5rem",
          boxShadow:
            "0 0 0 1px rgba(200,150,30,0.12), 0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(200,150,30,0.2)",
          padding: "3rem 2.5rem",
        }}
      >
        {/* Bismillah */}
        <div className="text-center mb-2">
          <span
            className="arabic-text"
            style={{ color: "var(--color-gold-light)", fontSize: "2.4rem", opacity: 0.9 }}
          >
            ﷽
          </span>
        </div>

        <div className="ornament-divider mb-6">
          <span style={{ color: "var(--color-gold)", fontSize: "1.1rem" }}>✦</span>
        </div>

        <h1
          className="text-center mb-1"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
            color: "white",
            letterSpacing: "0.04em",
          }}
        >
          Madrasa
        </h1>
        <p
          className="text-center mb-1"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "0.8125rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--color-gold-light)",
          }}
        >
          Dawoodi Bohra Community
        </p>
        <p
          className="text-center mb-8"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "1rem",
            color: "rgba(255,255,255,0.5)",
            fontStyle: "italic",
          }}
        >
          Learning Portal
        </p>

        <div className="flex flex-col gap-4">
          <PortalLink href="/teacher" label="Teacher Portal" gold />
          <PortalLink href="/student" label="Student Portal" />
        </div>

        <div className="ornament-divider mt-8">
          <span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>✦</span>
        </div>
        <p
          className="text-center mt-3"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.8125rem",
            color: "rgba(255,255,255,0.3)",
            fontStyle: "italic",
          }}
        >
          In the pursuit of sacred knowledge
        </p>
      </div>
    </main>
  );
}

function PortalLink({ href, label, gold }: { href: string; label: string; gold?: boolean }) {
  return (
    <Link
      href={href}
      style={
        gold
          ? {
              display: "block",
              textAlign: "center",
              padding: "1rem",
              borderRadius: "0.75rem",
              background: "linear-gradient(135deg, var(--color-gold) 0%, #A07318 100%)",
              border: "1px solid var(--color-gold-light)",
              color: "var(--color-navy)",
              fontFamily: "var(--font-heading)",
              fontSize: "1rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 700,
              boxShadow: "0 4px 20px rgba(200,150,30,0.35)",
              transition: "all 0.2s ease",
            }
          : {
              display: "block",
              textAlign: "center",
              padding: "1rem",
              borderRadius: "0.75rem",
              background: "transparent",
              border: "1px solid rgba(200,150,30,0.4)",
              color: "white",
              fontFamily: "var(--font-heading)",
              fontSize: "1rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 600,
              transition: "all 0.2s ease",
            }
      }
    >
      ✦ {label}
    </Link>
  );
}
