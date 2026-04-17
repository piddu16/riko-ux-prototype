import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n-context";
import { RbacProvider } from "@/lib/rbac-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Riko — UX Prototype",
  description: "Riko AI internal webapp UX prototype — Bandra Soap Pvt Ltd",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <I18nProvider>
          <RbacProvider>{children}</RbacProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
