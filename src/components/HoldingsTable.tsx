import { ACCOUNTS } from "@/data/plan";
import { formatAed, formatPct, formatUsd } from "@/lib/fx";
import type { PortfolioSnapshot } from "@/lib/types";

const ACCOUNT_NAME = Object.fromEntries(ACCOUNTS.map((a) => [a.id, a.name]));

export function HoldingsTable({ snap }: { snap: PortfolioSnapshot }) {
  return (
    <div className="card overflow-x-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">All holdings</h3>
        <span className="text-xs text-muted">
          P&L shown per holding. Entry-day rows are flagged — that red is bid-ask spread, not loss.
        </span>
      </div>
      <table className="w-full text-sm">
        <thead className="text-xs text-muted">
          <tr className="border-b border-line">
            <th className="text-left py-2">Symbol</th>
            <th className="text-left">Account</th>
            <th className="text-right">Qty</th>
            <th className="text-right">Last</th>
            <th className="text-right">Value AED</th>
            <th className="text-right">Value USD</th>
            <th className="text-right">P&amp;L %</th>
          </tr>
        </thead>
        <tbody>
          {snap.holdings.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-8 text-center text-muted">
                No holdings yet. Run <code className="num">npm run seed &amp;&amp; npm run refresh</code> to populate.
              </td>
            </tr>
          ) : (
            snap.holdings.map((h) => {
              const pnlClass =
                h.entryDayNoise
                  ? "text-muted"
                  : h.pnlPctNative > 0
                  ? "text-good"
                  : h.pnlPctNative < 0
                  ? "text-bad"
                  : "text-text";
              return (
                <tr key={h.symbol} className="border-b border-line/50">
                  <td className="py-2">
                    <div className="font-medium">{h.symbol}</div>
                    <div className="text-xs text-muted">{h.name}</div>
                  </td>
                  <td className="text-xs text-muted">{ACCOUNT_NAME[h.account] ?? h.account}</td>
                  <td className="text-right num">{h.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                  <td className="text-right num text-muted">
                    {h.lastPriceNative.toLocaleString(undefined, { maximumFractionDigits: 2 })} {h.currency}
                  </td>
                  <td className="text-right num">{formatAed(h.valueAed)}</td>
                  <td className="text-right num text-muted">{formatUsd(h.valueUsd)}</td>
                  <td className={`text-right num ${pnlClass}`}>
                    {h.entryDayNoise ? (
                      <span className="tag">spread</span>
                    ) : (
                      formatPct(h.pnlPctNative)
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
