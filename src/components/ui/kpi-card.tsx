"use client";

import { motion } from "framer-motion";
import { Sparkline } from "./sparkline";

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  sub?: string;
  trend?: number;
  sparkData?: number[];
  accentColor?: string;
}

export function KpiCard({
  title,
  value,
  unit,
  sub,
  trend,
  sparkData,
  accentColor = "var(--green)",
}: KpiCardProps) {
  const isPrefix = unit === "\u20B9";
  const isSuffix = unit === "%";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Top accent stripe */}
      <div className="h-0.5" style={{ background: accentColor }} />

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] uppercase tracking-wider font-medium mb-2"
              style={{ color: "var(--text-4)" }}
            >
              {title}
            </p>
            <p
              className="text-2xl font-bold leading-none"
              style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {isPrefix && <span className="text-base font-medium mr-0.5">{unit}</span>}
              {value}
              {isSuffix && <span className="text-base font-medium ml-0.5">{unit}</span>}
            </p>
          </div>

          {sparkData && sparkData.length > 1 && (
            <div className="ml-3 flex-shrink-0">
              <Sparkline data={sparkData} color={accentColor} width={58} height={20} />
            </div>
          )}
        </div>

        {(trend !== undefined || sub) && (
          <div className="mt-2 flex items-center gap-2">
            {trend !== undefined && (
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded"
                style={{
                  color: trend >= 0 ? "var(--green)" : "var(--red)",
                  background: trend >= 0 ? "var(--green-bg)" : "var(--red-bg)",
                }}
              >
                {trend >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(trend).toFixed(1)}%
              </span>
            )}
            {sub && (
              <span className="text-xs" style={{ color: "var(--text-4)" }}>
                {sub}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
