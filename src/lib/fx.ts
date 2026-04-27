/**
 * AED is pegged to USD at 3.6725. The peg has held since 1997 and is unlikely
 * to move, so we treat this as a constant rather than a fetched rate.
 *
 * INR and GBp (pence sterling) are quoted natively and need a runtime rate.
 * For now we accept INR/USD and GBp/USD as inputs from the price provider; if
 * the provider returns AED already (e.g. ENBD Gold) we pass through.
 */

export const AED_PER_USD = Number(process.env.FX_AED_PER_USD ?? 3.6725);

export function usdToAed(usd: number): number {
  return usd * AED_PER_USD;
}

export function aedToUsd(aed: number): number {
  return aed / AED_PER_USD;
}

export function formatAed(n: number, opts: { compact?: boolean } = {}): string {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    notation: opts.compact ? "compact" : "standard",
    maximumFractionDigits: opts.compact ? 1 : 0,
  }).format(n);
}

export function formatUsd(n: number, opts: { compact?: boolean } = {}): string {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: opts.compact ? "compact" : "standard",
    maximumFractionDigits: opts.compact ? 1 : 0,
  }).format(n);
}

export function formatPct(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

export function formatBps(bps: number): string {
  return `${bps.toFixed(0)} bps`;
}
