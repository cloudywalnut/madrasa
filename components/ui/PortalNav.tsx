"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLink {
  href: string;
  label: string;
}

interface PortalNavProps {
  role: "teacher" | "student";
  links: NavLink[];
}

export default function PortalNav({ role, links }: PortalNavProps) {
  const pathname = usePathname();

  return (
    <nav className="madrasa-nav sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link
            href={`/${role}`}
            className="flex items-center gap-3"
            style={{ textDecoration: "none" }}
          >
            <span style={{ color: "var(--color-gold)", fontSize: "1.5rem" }}>✦</span>
            <div>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.125rem",
                  color: "white",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Madrasa
              </span>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "0.6875rem",
                  color: "var(--color-gold-light)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  display: "block",
                  lineHeight: 1,
                  marginTop: "2px",
                }}
              >
                {role === "teacher" ? "Teacher Portal" : "Student Portal"}
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-1">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "0.8125rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "0.4rem 0.875rem",
                    borderRadius: "0.375rem",
                    color: active ? "var(--color-navy)" : "rgba(255,255,255,0.75)",
                    background: active
                      ? "var(--color-gold)"
                      : "transparent",
                    border: active
                      ? "1px solid var(--color-gold-light)"
                      : "1px solid transparent",
                    transition: "all 0.15s ease",
                    textDecoration: "none",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Switch portal link */}
          <Link
            href={role === "teacher" ? "/student" : "/teacher"}
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
              transition: "color 0.15s",
            }}
          >
            Switch →
          </Link>
        </div>
      </div>
    </nav>
  );
}
