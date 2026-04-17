"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkline } from "./sparkline";

/* ── Animated count-up hook ── */
function useCountUp(target: string, duration = 1200) {
  const [display, setDisplay] = useState(target);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const hasRun = useRef(false);

  useEffect(() => {
    if (!inView || hasRun.current) return;
    hasRun.current = true;

    // Extract numeric part
    const numMatch = target.match(/-?[\d.]+/);
    if (!numMatch) { setDisplay(target); return; }

    const end = parseFloat(numMatch[0]);
    const prefix = target.slice(0, numMatch.index);
    const suffix = target.slice((numMatch.index || 0) + numMatch[0].length);
    const decimals = numMatch[0].includes(".") ? numMatch[0].split(".")[1].length : 0;
    const start = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = start + (end - start) * eased;
      setDisplay(`${prefix}${current.toFixed(decimals)}${suffix}`);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);

  return { display, ref };
}

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
  const { display, ref: countRef } = useCountUp(String(value));

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
              className="text-2xl font-bold leading-none tabular-nums"
              style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {isPrefix && <span className="text-base font-medium mr-0.5">{unit}</span>}
              <span ref={countRef}>{display}</span>
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
                className="text-xs font-semibold px-1.5 py-0.5 rounded tabular-nums"
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
