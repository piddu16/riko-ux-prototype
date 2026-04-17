"use client";

import { FileText, FileSpreadsheet, MessageCircle, Mail } from "lucide-react";

const buttons = [
  { label: "PDF", icon: FileText, color: "var(--red)" },
  { label: "Excel", icon: FileSpreadsheet, color: "var(--green)" },
  { label: "WhatsApp", icon: MessageCircle, color: "#25D366" },
  { label: "Email", icon: Mail, color: "var(--blue)" },
] as const;

export function ExportBar() {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium" style={{ color: "var(--text-4)" }}>
        Export:
      </span>
      {buttons.map(({ label, icon: Icon, color }) => (
        <button
          key={label}
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-80 cursor-pointer"
          style={{
            background: `color-mix(in srgb, ${color} 10%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
            color,
          }}
        >
          <Icon size={13} />
          {label}
        </button>
      ))}
    </div>
  );
}
