import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "gold" | "ghost" | "danger";
  children: ReactNode;
  loading?: boolean;
}

export default function Button({
  variant = "primary",
  children,
  loading,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const cls = `btn-${variant} ${className}`;
  return (
    <button {...props} disabled={disabled || loading} className={cls}>
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
}
