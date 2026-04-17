"use client";

interface PillProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Pill({ children, color = "var(--green)", className = "" }: PillProps) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-semibold inline-block ${className}`}
      style={{
        background: `color-mix(in srgb, ${color} 20%, transparent)`,
        color,
      }}
    >
      {children}
    </span>
  );
}
