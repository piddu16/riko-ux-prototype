"use client";

/* ═══════════════════════════════════════════════════════════════
   Chart export helpers — download as PNG, share to WhatsApp
   ═══════════════════════════════════════════════════════════════
   Used by ResultPanel's header icons. Works across:
     • ECharts canvas charts (treemap, heatmap, sankey, scatter, radar)
     • Custom SVG charts (ChatLineChart, ChatBarChart, ChatDonut,
       ChatForecastChart, ChatStackedBar, ChatWaterfall, Gauge)

   Strategy: find the canvas OR svg in the container. For canvas,
   toDataURL directly. For svg, serialize + rasterize via an offscreen
   canvas (avoids adding html2canvas as a dep).
   ═══════════════════════════════════════════════════════════════ */

/** Find the most likely chart root inside `container`. Returns
 *  either the first <canvas> (ECharts) or the first <svg> (custom). */
function findChartNode(container: Element | null): HTMLCanvasElement | SVGSVGElement | null {
  if (!container) return null;
  const canvas = container.querySelector("canvas");
  if (canvas) return canvas as HTMLCanvasElement;
  const svg = container.querySelector("svg");
  if (svg) return svg as SVGSVGElement;
  return null;
}

/** Convert an SVG element to a PNG data URL by rasterizing on a
 *  temp canvas. Preserves computed CSS by inlining via
 *  `getComputedStyle` isn't free, so for our internal charts we
 *  rely on colors set via inline attributes/style. */
async function svgToPng(svg: SVGSVGElement, scale = 2): Promise<string> {
  // Resolve intrinsic dimensions
  const rect = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  const w = rect.width || vb.width || 640;
  const h = rect.height || vb.height || 360;

  // Inline all `var(--xxx)` CSS variables as their resolved values.
  // The offscreen SVG loses DOM context so CSS vars won't resolve.
  // We walk the tree and resolve fill/stroke on each node.
  const root = document.documentElement;
  const resolveVar = (val: string): string => {
    // Very naive: only handles simple var(--name) or var(--name, fallback)
    return val.replace(/var\(\s*(--[a-zA-Z0-9-]+)(?:\s*,\s*([^)]+))?\s*\)/g, (_, name, fallback) => {
      const resolved = getComputedStyle(root).getPropertyValue(name).trim();
      if (resolved) return resolved;
      return (fallback ?? "").trim();
    });
  };
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.querySelectorAll<SVGElement>("*").forEach((el) => {
    const fill = el.getAttribute("fill");
    if (fill && fill.includes("var(")) el.setAttribute("fill", resolveVar(fill));
    const stroke = el.getAttribute("stroke");
    if (stroke && stroke.includes("var(")) el.setAttribute("stroke", resolveVar(stroke));
    // Also walk inline styles
    const style = el.getAttribute("style");
    if (style && style.includes("var(")) el.setAttribute("style", resolveVar(style));
  });
  // If the svg has no fill at root, give it a bg based on theme surface
  const bg = resolveVar("var(--bg-surface)");
  if (bg) {
    clone.setAttribute("style", `background:${bg}`);
  }

  // Ensure width/height attrs are set (some SVGs rely on viewBox only)
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));

  const xml = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("2d context unavailable"));
        return;
      }
      ctx.fillStyle = bg || "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/** Trigger a browser download for a data URL. */
function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** Download the chart inside `container` as PNG with the given filename.
 *  Returns true if something was exported, false if no chart was found. */
export async function downloadChartAsPng(
  container: Element | null,
  filename: string
): Promise<boolean> {
  const node = findChartNode(container);
  if (!node) return false;

  let dataUrl: string;
  if (node instanceof HTMLCanvasElement) {
    // ECharts canvas — direct export at 2x pixel density
    try {
      dataUrl = node.toDataURL("image/png");
    } catch {
      return false;
    }
  } else {
    // SVG → rasterize
    try {
      dataUrl = await svgToPng(node);
    } catch {
      return false;
    }
  }

  triggerDownload(dataUrl, filename);
  return true;
}

/** Open WhatsApp web/native with a prepared greeting. In a real
 *  product this would attach an image; WhatsApp's URL scheme doesn't
 *  support direct image attachment, so we open with text. The user can
 *  paste the downloaded PNG after. */
export function shareToWhatsApp(message: string) {
  const encoded = encodeURIComponent(message);
  // wa.me works on both web and native (deeplinks into the app on mobile)
  const url = `https://wa.me/?text=${encoded}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Compose a filename-safe slug from an intent label. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
