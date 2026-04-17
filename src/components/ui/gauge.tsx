"use client";

interface GaugeProps {
  value: number;
  min?: number;
  max?: number;
  thresholds?: { red: number; yellow: number };
  size?: number;
  label?: string;
}

export function Gauge({
  value,
  min = 0,
  max = 100,
  thresholds = { red: 30, yellow: 60 },
  size = 120,
  label,
}: GaugeProps) {
  const startAngle = -135;
  const endAngle = 135;
  const totalAngle = endAngle - startAngle;

  const clamped = Math.max(min, Math.min(max, value));
  const fraction = (clamped - min) / (max - min);
  const valueAngle = startAngle + fraction * totalAngle;

  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) - 10;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const arcPoint = (angle: number) => ({
    x: cx + r * Math.cos(toRad(angle)),
    y: cy + r * Math.sin(toRad(angle)),
  });

  const describeArc = (from: number, to: number) => {
    const s = arcPoint(from);
    const e = arcPoint(to);
    const sweep = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${sweep} 1 ${e.x} ${e.y}`;
  };

  const color =
    clamped < thresholds.red
      ? "var(--red)"
      : clamped < thresholds.yellow
      ? "var(--yellow)"
      : "var(--green)";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.75}`}>
        {/* Background arc */}
        <path
          d={describeArc(startAngle, endAngle)}
          fill="none"
          stroke="var(--border)"
          strokeWidth={8}
          strokeLinecap="round"
        />
        {/* Value arc */}
        {fraction > 0 && (
          <path
            d={describeArc(startAngle, valueAngle)}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
          />
        )}
        {/* Value text */}
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-1)"
          fontSize={size * 0.2}
          fontWeight="700"
          fontFamily="'Space Grotesk', sans-serif"
        >
          {Math.round(value)}
        </text>
      </svg>
      {label && (
        <span
          className="text-xs font-medium -mt-1"
          style={{ color: "var(--text-3)" }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
