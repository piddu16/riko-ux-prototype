"use client";

import { motion } from "framer-motion";

interface BreakdownItem {
  label: string;
  score: number;
  color: string;
}

interface HealthScoreProps {
  score: number;
  breakdown: BreakdownItem[];
}

export function HealthScore({ score, breakdown }: HealthScoreProps) {
  const size = 64;
  const strokeWidth = 5;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(score, 100) / 100;

  const ringColor =
    score >= 60 ? "var(--green)" : score >= 40 ? "var(--yellow)" : "var(--red)";

  return (
    <div className="flex items-center gap-5">
      {/* Circular ring */}
      <div className="flex-shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: circumference * (1 - progress) }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          {/* Score text */}
          <text
            x={size / 2}
            y={size / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--text-1)"
            fontSize="18"
            fontWeight="700"
            fontFamily="'Space Grotesk', sans-serif"
          >
            {score}
          </text>
        </svg>
      </div>

      {/* Breakdown bars */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        {breakdown.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="text-[10px] w-20 flex-shrink-0 truncate"
              style={{ color: "var(--text-3)" }}
            >
              {item.label}
            </span>
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--border)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(item.score, 100)}%`,
                  background: item.color,
                }}
              />
            </div>
            <span
              className="text-[10px] font-semibold w-6 text-right flex-shrink-0"
              style={{ color: item.color }}
            >
              {item.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
