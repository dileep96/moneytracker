/**
 * CoinGecko free `simple/price` endpoint. No auth required for low-rate
 * personal use.
 *   https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd
 */

const ENDPOINT = "https://api.coingecko.com/api/v3/simple/price";

export interface CryptoQuote {
  id: string;
  priceUsd: number;
  asOf: string;
}

export async function fetchCryptoQuotes(ids: string[]): Promise<CryptoQuote[]> {
  if (ids.length === 0) return [];
  const url = `${ENDPOINT}?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=usd&precision=2`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
  const json = (await res.json()) as Record<string, { usd: number }>;
  const ts = new Date().toISOString();
  return ids.map((id) => ({ id, priceUsd: Number(json[id]?.usd ?? 0), asOf: ts }));
}
