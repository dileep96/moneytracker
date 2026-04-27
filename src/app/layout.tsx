import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Money Tracker — Dubai expat investment dashboard",
  description: "Personal portfolio tracker across Mashreq NEO, ENBD, ICICI NRI, and Interactive Brokers.",
};

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/holdings", label: "Holdings" },
  { href: "/allocation", label: "Allocation" },
  { href: "/cashflow", label: "Cash flow" },
  { href: "/fees", label: "Fees" },
  { href: "/settings", label: "Settings" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-line bg-panel">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center font-mono text-accent">
                M
              </div>
              <div>
                <div className="font-semibold">Money Tracker</div>
                <div className="text-xs text-muted">Dubai expat · 5–7y horizon · moderate risk</div>
              </div>
            </div>
            <nav className="flex gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="px-3 py-1.5 rounded-lg text-sm text-muted hover:text-text hover:bg-panel2"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
        <footer className="max-w-6xl mx-auto px-6 py-8 text-xs text-muted">
          Built for personal use. AED↔USD pegged at 3.6725. Default view is monthly to discourage
          panic-checking. Daily P&amp;L within entry-day spread is normal — not a loss.
        </footer>
      </body>
    </html>
  );
}
