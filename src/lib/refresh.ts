/**
 * One-shot refresh that pulls IBKR Flex (if configured), stamps prices from
 * Yahoo / CoinGecko / AMFI, and persists everything to SQLite.
 */

import { PLANNED_HOLDINGS } from "@/data/plan";
import { recordPrice, saveSnapshot, setSetting, upsertHolding } from "@/lib/db";
import { fetchFlex } from "@/lib/ibkr/flex";
import { fetchAmfiNav, fetchInrPerUsd } from "@/lib/prices/amfi";
import { fetchCryptoQuotes } from "@/lib/prices/coingecko";
import { fetchYahooQuotes } from "@/lib/prices/yahoo";
import { buildSnapshot } from "@/lib/snapshot";

export interface RefreshReport {
  ibkr: { ok: boolean; positions: number; nav?: number; error?: string };
  yahoo: { ok: boolean; quotes: number; error?: string };
  crypto: { ok: boolean; quotes: number; error?: string };
  amfi: { ok: boolean; quotes: number; inrPerUsd?: number; error?: string };
  totalAed: number;
  totalUsd: number;
}

export async function refreshAll(): Promise<RefreshReport> {
  const report: RefreshReport = {
    ibkr: { ok: false, positions: 0 },
    yahoo: { ok: false, quotes: 0 },
    crypto: { ok: false, quotes: 0 },
    amfi: { ok: false, quotes: 0 },
    totalAed: 0,
    totalUsd: 0,
  };

  // 1. IBKR Flex (truth source for IBKR holdings + crypto if configured there)
  const token = process.env.IBKR_FLEX_TOKEN;
  const queryId = process.env.IBKR_FLEX_QUERY_ID;
  if (token && queryId) {
    try {
      const flex = await fetchFlex(token, queryId);
      for (const p of flex.positions) {
        const planned = PLANNED_HOLDINGS.find(
          (h) => h.symbol === p.symbol || h.sourceId === p.symbol,
        );
        upsertHolding({
          symbol: planned?.symbol ?? p.symbol,
          name: planned?.name ?? p.description,
          account: planned?.account ?? "ibkr",
          asset_class: planned?.assetClass ?? (p.assetCategory === "STK" ? "equity_etf" : "equity_etf"),
          currency: p.currency,
          quantity: p.position,
          avg_cost_native: p.costBasisPrice,
          last_price_native: p.markPrice,
          last_price_at: new Date().toISOString(),
          source: "ibkr_flex",
          source_id: planned?.sourceId ?? p.conid ?? null,
        });
        recordPrice(planned?.symbol ?? p.symbol, p.markPrice);
      }
      report.ibkr = { ok: true, positions: flex.positions.length, nav: flex.nav?.total };
    } catch (e) {
      report.ibkr.error = e instanceof Error ? e.message : String(e);
    }
  } else {
    report.ibkr.error = "IBKR_FLEX_TOKEN / IBKR_FLEX_QUERY_ID not set";
  }

  // 2. Yahoo (LSE-listed UCITS ETFs) -- still call so we have prices for any
  // symbol IBKR didn't return, and to back-fill avg cost the first time.
  const yahooSymbols = PLANNED_HOLDINGS
    .filter((h) => h.source === "yahoo" && h.sourceId)
    .map((h) => h.sourceId!) as string[];
  try {
    const quotes = await fetchYahooQuotes(yahooSymbols);
    for (const q of quotes) {
      const planned = PLANNED_HOLDINGS.find((h) => h.sourceId === q.symbol);
      if (!planned) continue;
      // Don't overwrite IBKR Flex price if we already have one fresher.
      upsertHolding({
        symbol: planned.symbol,
        name: planned.name,
        account: planned.account,
        asset_class: planned.assetClass,
        currency: q.currency,
        last_price_native: q.priceNative,
        last_price_at: q.asOf,
        source: report.ibkr.ok ? "ibkr_flex" : "yahoo",
        source_id: planned.sourceId ?? null,
      });
      recordPrice(planned.symbol, q.priceNative, q.asOf);
    }
    report.yahoo = { ok: true, quotes: quotes.length };
  } catch (e) {
    report.yahoo.error = e instanceof Error ? e.message : String(e);
  }

  // 3. Crypto via CoinGecko
  const cryptoIds = PLANNED_HOLDINGS
    .filter((h) => h.source === "coingecko" && h.sourceId)
    .map((h) => h.sourceId!) as string[];
  try {
    const quotes = await fetchCryptoQuotes(cryptoIds);
    for (const q of quotes) {
      const planned = PLANNED_HOLDINGS.find((h) => h.sourceId === q.id);
      if (!planned) continue;
      upsertHolding({
        symbol: planned.symbol,
        name: planned.name,
        account: planned.account,
        asset_class: planned.assetClass,
        currency: "USD",
        last_price_native: q.priceUsd,
        last_price_at: q.asOf,
        source: "coingecko",
        source_id: planned.sourceId ?? null,
      });
      recordPrice(planned.symbol, q.priceUsd, q.asOf);
    }
    report.crypto = { ok: true, quotes: quotes.length };
  } catch (e) {
    report.crypto.error = e instanceof Error ? e.message : String(e);
  }

  // 4. AMFI for Indian MFs
  const amfiCodes = PLANNED_HOLDINGS
    .filter((h) => h.source === "amfi" && h.sourceId)
    .map((h) => h.sourceId!) as string[];
  let inrPerUsd = 83;
  try {
    inrPerUsd = await fetchInrPerUsd();
    setSetting("inr_per_usd", String(inrPerUsd));
    const navs = await fetchAmfiNav(amfiCodes);
    for (const n of navs) {
      const planned = PLANNED_HOLDINGS.find((h) => h.sourceId === n.schemeCode);
      if (!planned) continue;
      upsertHolding({
        symbol: planned.symbol,
        name: planned.name,
        account: planned.account,
        asset_class: planned.assetClass,
        currency: "INR",
        last_price_native: n.navInr,
        last_price_at: new Date().toISOString(),
        source: "amfi",
        source_id: planned.sourceId ?? null,
      });
      recordPrice(planned.symbol, n.navInr);
    }
    report.amfi = { ok: true, quotes: navs.length, inrPerUsd };
  } catch (e) {
    report.amfi.error = e instanceof Error ? e.message : String(e);
  }

  const snap = buildSnapshot({ inrPerUsd });
  saveSnapshot(snap.totalAed, snap.totalUsd, snap);
  report.totalAed = snap.totalAed;
  report.totalUsd = snap.totalUsd;
  return report;
}
