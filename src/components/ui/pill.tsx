"use client";

interface PillProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
  /** Show a small leading dot in the colour. Default true. */
  dot?: boolean;
  /** Filled variant — for legacy / strong-emphasis cases. Default subtle. */
  variant?: "subtle" | "filled";
}

/**
 * Sober status badge. Hairline-free, transparent fill by default — the
 * colour rides on a tiny leading dot + the text glyph itself, never on a
 * tinted background. Pass variant="filled" for the older chunky look when
 * a number really needs to scream.
 */
export function Pill({
  children,
  color = "var(--text-3)",
  className = "",
  dot = true,
  variant = "subtle",
}: PillProps) {
  if (variant === "filled") {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-semibold tabular-nums ${className}`}
        style={{
          background: `color-mix(in srgb, ${color} 16%, transparent)`,
          color,
        }}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider tabular-nums ${className}`}
      style={{
        color,
        background: "transparent",
      }}
    >
      {dot && (
        <span
          aria-hidden
          className="inline-block flex-shrink-0"
          style={{
            width: 5,
            height: 5,
            borderRadius: 999,
            background: color,
          }}
        />
      )}
      {children}
    </span>
  );
}
