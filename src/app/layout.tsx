import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n-context";
import { RbacProvider } from "@/lib/rbac-context";
import { CompanyProvider } from "@/lib/company-context";

// Riko Brand Manual v1.0 — three voices in concert.
// Inter: primary workhorse (body + UI). Stylistic sets ss01, cv11 are
// enabled globally in globals.css for the rupee glyph and contextual
// alternates. tabular-nums applied via `.tabular-nums` utility / font
// feature when rendering money.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Instrument Serif: editorial accent. ITALIC ONLY per the manual —
// reserved for emotional emphasis on ≤1 phrase per heading.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: "italic",
});

// JetBrains Mono: label voice. Used for eyebrows, taxonomy, numeric
// labels, file paths, and the "machine speaks" register.
const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Riko — UX Prototype",
  description: "The AI operating layer above Tally.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <I18nProvider>
          <RbacProvider>
            <CompanyProvider>{children}</CompanyProvider>
          </RbacProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
