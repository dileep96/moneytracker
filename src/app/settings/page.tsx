import { ACCOUNTS, ALLOCATION_TARGETS, PLANNED_HOLDINGS, SALARY_AED } from "@/data/plan";
import { formatAed, formatPct, AED_PER_USD } from "@/lib/fx";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const ibkrConfigured = Boolean(process.env.IBKR_FLEX_TOKEN && process.env.IBKR_FLEX_QUERY_ID);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="card">
        <h3 className="font-semibold mb-3">Integrations</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between">
            <span>IBKR Flex Web Service</span>
            <span className={ibkrConfigured ? "text-good" : "text-warn"}>
              {ibkrConfigured ? "Configured" : "Set IBKR_FLEX_TOKEN + IBKR_FLEX_QUERY_ID in .env"}
            </span>
          </li>
          <li className="flex justify-between">
            <span>Yahoo Finance (LSE UCITS quotes)</span>
            <span className="text-good">Always on (no key required)</span>
          </li>
          <li className="flex justify-between">
            <span>CoinGecko (BTC, ETH)</span>
            <span className="text-good">Always on (free tier)</span>
          </li>
          <li className="flex justify-between">
            <span>AMFI India (mutual fund NAV)</span>
            <span className="text-good">Always on</span>
          </li>
          <li className="flex justify-between">
            <span>FX (AED/USD peg)</span>
            <span className="num text-muted">{AED_PER_USD.toFixed(4)} (constant)</span>
          </li>
        </ul>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Plan summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted text-xs">Salary (AED / month)</div>
            <div className="num text-lg">{formatAed(SALARY_AED)}</div>
          </div>
          <div>
            <div className="text-muted text-xs">Monthly deployment</div>
            <div className="num text-lg">
              {formatAed(PLANNED_HOLDINGS.reduce((s, p) => s + p.monthlyAed, 0))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Accounts</h3>
        <ul className="space-y-2 text-sm">
          {ACCOUNTS.map((a) => (
            <li key={a.id}>
              <div className="font-medium">{a.name}</div>
              <div className="text-muted text-xs">{a.role}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Allocation targets</h3>
        <ul className="text-sm space-y-1">
          {ALLOCATION_TARGETS.map((t) => (
            <li key={t.bucket} className="flex justify-between">
              <span>{t.bucket}</span>
              <span className="num">{formatPct(t.targetPct)}</span>
            </li>
          ))}
        </ul>
        <div className="text-xs text-muted mt-2">
          Edit <code className="num">src/data/plan.ts</code> to change target weights or DCA amounts.
        </div>
      </div>
    </div>
  );
}
