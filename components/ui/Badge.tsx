import { ReactNode } from "react";

interface BadgeProps {
  variant?: "gold" | "blue" | "green" | "red";
  children: ReactNode;
}

export default function Badge({ variant = "blue", children }: BadgeProps) {
  return <span className={`badge-${variant}`}>{children}</span>;
}
