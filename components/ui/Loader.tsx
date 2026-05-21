export default function Loader() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "5rem 2rem",
        gap: "0.875rem",
      }}
    >
      <div
        style={{
          width: "2.25rem",
          height: "2.25rem",
          border: "3px solid var(--color-gold-pale)",
          borderTop: "3px solid var(--color-gold)",
          borderRadius: "50%",
          animation: "spin 0.9s linear infinite",
        }}
      />
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "1rem",
          color: "var(--color-muted)",
          fontStyle: "italic",
          margin: 0,
        }}
      >
        Loading…
      </p>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.72rem",
          color: "var(--color-border)",
          letterSpacing: "0.04em",
          textAlign: "center",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        Designed &amp; Developed by
        <br />
        <span style={{ fontFamily: "var(--font-heading)", fontStyle: "normal", letterSpacing: "0.06em" }}>
          Mustansir Muhammad Betulwala
        </span>
        {" "}— Vertices.AI
      </p>
    </div>
  );
}
