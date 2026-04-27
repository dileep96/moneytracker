import {
  ACCOUNTS,
  ALLOCATION_TARGETS,
  PLANNED_HOLDINGS,
  PNL_NOISE,
  type AccountId,
  type AssetClass,
} from "@/data/plan";
import { dcaThisMonth, listHoldings, type HoldingRow } from "@/lib/db";
import { aedToUsd, AED_PER_USD } from "@/lib/fx";
import type { AllocationRow, DcaProgress, Holding, PortfolioSnapshot } from "@/lib/types";

function rowToHolding(r: HoldingRow): Holding {
  return {
    symbol: r.symbol,
    name: r.name,
    account: r.account as AccountId,
    assetClass: r.asset_class as AssetClass,
    currency: r.currency,
    quantity: r.quantity,
    avgCostNative: r.avg_cost_native,
    lastPriceNative: r.last_price_native,
    lastPriceAt: r.last_price_at ?? new Date().toISOString(),
    source: r.source as Holding["source"],
    sourceId: r.source_id ?? undefined,
    firstAcquiredAt: r.first_acquired_at ?? undefined,
    notes: r.notes ?? undefined,
  };
}

/**
 * Convert a native-currency value to AED. INR/USDINR is fetched once at refresh
 * time and stamped onto the holding's last_price_native (we always store native).
 * For conversion at view time we use:
 *   USD -> AED via the peg (3.6725)
 *   AED -> AED identity
 *   INR -> AED via INR/USD (cached on settings) * peg
 *   GBp -> USD treated by yahoo already; pass as USD
 */
function valueToAedUsd(qty: number, priceNative: number, currency: string, inrPerUsd: number) {
  const cur = currency.toUpperCase();
  let usd = 0;
  if (cur === "USD" || cur === "USDC") usd = qty * priceNative;
  else if (cur === "AED") usd = (qty * priceNative) / AED_PER_USD;
  else if (cur === "INR") usd = (qty * priceNative) / inrPerUsd;
  else if (cur === "GBP") usd = qty * priceNative; // best-effort; CSPX.L IOB is USD-quoted anyway
  else if (cur === "GBX" || cur === "GBP_PENCE") usd = (qty * (priceNative / 100));
  else usd = qty * priceNative; // fallback: assume USD
  return { usd, aed: usd * AED_PER_USD };
}

export function buildSnapshot(opts: { inrPerUsd?: number } = {}): PortfolioSnapshot {
  const inrPerUsd = opts.inrPerUsd ?? 83;
  const rows = listHoldings();
  const holdings = rows.map(rowToHolding);
  const now = Date.now();

  const enriched = holdings.map((h) => {
    const { usd, aed } = valueToAedUsd(h.quantity, h.lastPriceNative, h.currency, inrPerUsd);
    const costBasisValue = h.quantity * h.avgCostNative;
    const marketValue = h.quantity * h.lastPriceNative;
    const pnlNative = marketValue - costBasisValue;
    const pnlPctNative = costBasisValue > 0 ? pnlNative / costBasisValue : 0;
    const acqMs = h.firstAcquiredAt ? Date.parse(h.firstAcquiredAt) : NaN;
    const entryDayNoise =
      Number.isFinite(acqMs) && now - acqMs < PNL_NOISE.entryDayHours * 3600 * 1000;
    return { ...h, valueAed: aed, valueUsd: usd, pnlNative, pnlPctNative, entryDayNoise };
  });

  const totalAed = enriched.reduce((s, h) => s + h.valueAed, 0);
  const totalUsd = aedToUsd(totalAed);

  const byAccount = ACCOUNTS.reduce((acc, a) => {
    acc[a.id] = { aed: 0, usd: 0 };
    return acc;
  }, {} as Record<AccountId, { aed: number; usd: number }>);

  const byAssetClass: Record<AssetClass, { aed: number; usd: number }> = {
    cash: { aed: 0, usd: 0 },
    emergency: { aed: 0, usd: 0 },
    debt_repayment: { aed: 0, usd: 0 },
    equity_etf: { aed: 0, usd: 0 },
    equity_mf: { aed: 0, usd: 0 },
    gold: { aed: 0, usd: 0 },
    thematic: { aed: 0, usd: 0 },
    crypto: { aed: 0, usd: 0 },
  };

  for (const h of enriched) {
    byAccount[h.account].aed += h.valueAed;
    byAccount[h.account].usd += h.valueUsd;
    byAssetClass[h.assetClass].aed += h.valueAed;
    byAssetClass[h.assetClass].usd += h.valueUsd;
  }

  const allocations: AllocationRow[] = ALLOCATION_TARGETS.map((t) => {
    const aed = t.classes.reduce((s, c) => s + byAssetClass[c].aed, 0);
    const usd = t.classes.reduce((s, c) => s + byAssetClass[c].usd, 0);
    const actualPct = totalAed > 0 ? aed / totalAed : 0;
    const driftPct = actualPct - t.targetPct;
    const tol = (t.driftToleranceBps ?? 500) / 10_000;
    return {
      bucket: t.bucket,
      classes: t.classes,
      targetPct: t.targetPct,
      actualPct,
      driftPct,
      alert: Math.abs(driftPct) > tol,
      valueAed: aed,
      valueUsd: usd,
    };
  });

  const dca: DcaProgress[] = PLANNED_HOLDINGS.map((p) => {
    const mtd = dcaThisMonth(p.symbol);
    const pct = p.monthlyAed > 0 ? mtd / p.monthlyAed : 0;
    let status: DcaProgress["status"] = "on_track";
    const day = new Date().getUTCDate();
    const expectedPct = day / 30;
    if (pct < expectedPct - 0.15) status = "behind";
    else if (pct > expectedPct + 0.15) status = "ahead";
    return {
      symbol: p.symbol,
      name: p.name,
      account: p.account,
      monthlyTargetAed: p.monthlyAed,
      monthToDateAed: mtd,
      pct,
      status,
    };
  });

  return {
    asOf: new Date().toISOString(),
    totalAed,
    totalUsd,
    byAccount,
    byAssetClass,
    holdings: enriched,
    allocations,
    dca,
  };
}
