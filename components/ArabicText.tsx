import { CSSProperties } from "react";

interface ArabicTextProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  style?: CSSProperties;
}

const sizes: Record<string, string> = {
  sm:  "1.1rem",
  md:  "1.4rem",
  lg:  "1.75rem",
  xl:  "2.1rem",
  "2xl": "2.6rem",
};

export default function ArabicText({ children, size = "md", className = "", style }: ArabicTextProps) {
  return (
    <span
      className={`arabic-text ${className}`}
      style={{ fontSize: sizes[size], ...style }}
    >
      {children}
    </span>
  );
}
