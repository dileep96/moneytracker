import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance();

export interface YahooQuote {
  symbol: string;
  priceNative: number;
  currency: string;
  asOf: string;
}

/**
 * yahoo-finance2 returns prices for LSE-listed UCITS (e.g. CSPX.L) in pence
 * for GBP-quoted lines and in USD for USD-quoted lines. The UCITS ETFs we
 * track (CSPX.L, VWRA.L, EIMI.L, SGLN.L, RBOT.L, ARKE.L, FOOD.L) are USD-
 * quoted on LSE's IOB segment, so the quote currency comes back as USD. We
 * pass currency through and let the caller convert.
 */
export async function fetchYahooQuotes(symbols: string[]): Promise<YahooQuote[]> {
  if (symbols.length === 0) return [];
  const res = await yf.quote(symbols);
  const arr = Array.isArray(res) ? res : [res];
  return arr.map((q) => ({
    symbol: q.symbol ?? "",
    priceNative: Number(q.regularMarketPrice ?? 0),
    currency: String(q.currency ?? "USD"),
    asOf: q.regularMarketTime ? new Date(q.regularMarketTime).toISOString() : new Date().toISOString(),
  }));
}
