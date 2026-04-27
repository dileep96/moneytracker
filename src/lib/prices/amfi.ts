/**
 * AMFI publishes a daily NAV file for every Indian mutual fund:
 *   https://www.amfiindia.com/spages/NAVAll.txt
 *
 * Format is a header line then groups of `;`-delimited rows:
 *   Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;Scheme Name;Net Asset Value;Date
 *
 * Plus a USD/INR rate which we fetch separately via Yahoo (USDINR=X).
 */

import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance();

const NAV_URL = "https://www.amfiindia.com/spages/NAVAll.txt";

export interface AmfiNav {
  schemeCode: string;
  navInr: number;
  asOf: string;
}

let cache: { fetchedAt: number; rows: Map<string, AmfiNav> } | null = null;
const CACHE_MS = 1000 * 60 * 30; // 30 min

async function loadAmfi(): Promise<Map<string, AmfiNav>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) return cache.rows;
  const res = await fetch(NAV_URL);
  if (!res.ok) throw new Error(`AMFI HTTP ${res.status}`);
  const text = await res.text();
  const rows = new Map<string, AmfiNav>();
  for (const line of text.split(/\r?\n/)) {
    const parts = line.split(";");
    if (parts.length < 6) continue;
    const code = parts[0]?.trim();
    const nav = Number(parts[4]);
    const date = parts[5]?.trim();
    if (!code || !Number.isFinite(nav) || nav <= 0) continue;
    rows.set(code, { schemeCode: code, navInr: nav, asOf: date ?? "" });
  }
  cache = { fetchedAt: Date.now(), rows };
  return rows;
}

export async function fetchAmfiNav(schemeCodes: string[]): Promise<AmfiNav[]> {
  const map = await loadAmfi();
  return schemeCodes
    .map((c) => map.get(c))
    .filter((x): x is AmfiNav => Boolean(x));
}

export async function fetchInrPerUsd(): Promise<number> {
  const q = await yf.quote("USDINR=X");
  return Number(q.regularMarketPrice ?? 83);
}
