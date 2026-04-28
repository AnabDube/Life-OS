import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** When true, the card gets a brighter green border + soft glow to draw the eye. */
  highlight?: boolean;
  children: ReactNode;
}

/**
 * Reusable card surface using the dark green / gold design tokens.
 * Used by every module — keeps borders and radii consistent.
 */
export default function Card({
  highlight = false,
  className = "",
  children,
  ...rest
}: CardProps) {
  const base =
    "rounded-[var(--radius-card)] bg-card p-5 transition-shadow";
  const variant = highlight
    ? "border border-[var(--border-2)] shadow-[0_0_24px_var(--green-glow)]"
    : "border border-[var(--border-1)]";
  return (
    <div className={`${base} ${variant} ${className}`} {...rest}>
      {children}
    </div>
  );
}
