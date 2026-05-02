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

  // Treat anything red/yellow/orange as a severity dot worth surfacing.
  const showDot =
    accentColor === "var(--red)" ||
    accentColor === "var(--yellow)" ||
    accentColor === "var(--orange)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative rounded-md overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-2">
              {showDot && (
                <span
                  className="inline-block flex-shrink-0"
                  aria-hidden
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 999,
                    background: accentColor,
                  }}
                />
              )}
              <p
                className="text-[10px] uppercase tracking-wider font-medium"
                style={{ color: "var(--text-4)" }}
              >
                {title}
              </p>
            </div>
            <p
              className="text-2xl font-semibold leading-none tabular-nums"
              style={{
                color: "var(--text-1)",
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: "-0.02em",
              }}
            >
              {isPrefix && <span className="text-base font-medium mr-0.5">{unit}</span>}
              <span ref={countRef}>{display}</span>
              {isSuffix && <span className="text-base font-medium ml-0.5">{unit}</span>}
            </p>
          </div>

          {sparkData && sparkData.length > 1 && (
            <div className="flex-shrink-0">
              <Sparkline data={sparkData} color={accentColor} width={58} height={20} />
            </div>
          )}
        </div>

        {(trend !== undefined || sub) && (
          <div className="mt-2.5 flex items-center gap-2 text-xs">
            {trend !== undefined && (
              <span
                className="font-medium tabular-nums"
                style={{
                  color: trend >= 0 ? "var(--green)" : "var(--red)",
                }}
              >
                {trend >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(trend).toFixed(1)}%
              </span>
            )}
            {sub && (
              <span style={{ color: "var(--text-4)" }}>
                {sub}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
