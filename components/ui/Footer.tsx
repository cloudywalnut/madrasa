export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--color-border)",
        padding: "1rem 1.5rem",
        textAlign: "center",
        background: "var(--color-ivory)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.8125rem",
          color: "var(--color-muted)",
          fontStyle: "italic",
          margin: 0,
        }}
      >
        Madrasa LMS &nbsp;·&nbsp; Designed &amp; Developed by{" "}
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontStyle: "normal",
            color: "var(--color-navy)",
            letterSpacing: "0.04em",
          }}
        >
          Mustansir Muhammad Betulwala
        </span>
        {" "}— Vertices.AI
      </p>
    </footer>
  );
}
