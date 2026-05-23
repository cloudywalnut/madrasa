import { isArabic } from "@/lib/arabic";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, breadcrumbs, action }: PageHeaderProps) {
  const arabicTitle = isArabic(title);
  const arabicSubtitle = subtitle ? isArabic(subtitle) : false;
  return (
    <div className="mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)", fontSize: "0.8125rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-muted)" }}>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span style={{ color: "var(--color-gold)", opacity: 0.6 }}>›</span>}
              {crumb.href ? (
                <a href={crumb.href} style={{ color: "var(--color-azure)" }} className="hover:underline">
                  {crumb.label}
                </a>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            style={{
              fontFamily: arabicTitle ? "var(--font-alkanz)" : "var(--font-heading)",
              fontSize: arabicTitle ? "clamp(1.75rem, 4vw, 2.25rem)" : "clamp(1.5rem, 4vw, 2rem)",
              color: "var(--color-navy)",
              letterSpacing: arabicTitle ? 0 : "0.02em",
              lineHeight: arabicTitle ? 1.8 : 1.2,
              direction: arabicTitle ? "rtl" : "ltr",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-1"
              style={{
                fontFamily: arabicSubtitle ? "var(--font-alkanz)" : "var(--font-body)",
                fontSize: arabicSubtitle ? "1.1rem" : "1rem",
                color: "var(--color-muted)",
                fontStyle: arabicSubtitle ? "normal" : "italic",
                direction: arabicSubtitle ? "rtl" : "ltr",
                lineHeight: arabicSubtitle ? 1.8 : undefined,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="shrink-0 w-full md:w-auto">
            {action}
          </div>
        )}
      </div>
      {/* Gold rule */}
      <div
        className="mt-4"
        style={{
          height: "2px",
          background:
            "linear-gradient(90deg, var(--color-gold) 0%, var(--color-gold-pale) 60%, transparent 100%)",
          borderRadius: "1px",
        }}
      />
    </div>
  );
}
