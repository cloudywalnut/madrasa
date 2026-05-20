interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
      style={{
        background: "var(--color-gold-mist)",
        border: "1px dashed var(--color-gold-pale)",
        borderRadius: "1rem",
      }}
    >
      <div style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: 0.4, color: "var(--color-gold)" }}>
        ✦
      </div>
      <h3
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1rem",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--color-navy)",
          marginBottom: "0.5rem",
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.9375rem",
            color: "var(--color-muted)",
            fontStyle: "italic",
            marginBottom: "1.5rem",
          }}
        >
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
