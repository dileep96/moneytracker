import { CashflowWaterfall } from "@/components/CashflowWaterfall";
import { DcaProgressList } from "@/components/DcaProgress";
import { ACCOUNTS, PLANNED_HOLDINGS } from "@/data/plan";
import { getSetting } from "@/lib/db";
import { formatAed } from "@/lib/fx";
import { buildSnapshot } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

const ACCOUNT_NAME = Object.fromEntries(ACCOUNTS.map((a) => [a.id, a.name]));

export default function CashflowPage() {
  const inrPerUsd = Number(getSetting("inr_per_usd") ?? 83);
  const snap = buildSnapshot({ inrPerUsd });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Cash flow</h1>
      <CashflowWaterfall />

      <div className="card">
        <h3 className="font-semibold mb-2">Monthly deployment plan ({formatAed(PLANNED_HOLDINGS.reduce((s, p) => s + p.monthlyAed, 0))})</h3>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              <th className="text-left py-2">Symbol</th>
              <th className="text-left">Account</th>
              <th className="text-left">Class</th>
              <th className="text-right">AED / month</th>
            </tr>
          </thead>
          <tbody>
            {PLANNED_HOLDINGS.map((p) => (
              <tr key={p.symbol} className="border-b border-line/50">
                <td className="py-2">
                  <div className="font-medium">{p.symbol}</div>
                  <div className="text-xs text-muted">{p.name}</div>
                </td>
                <td className="text-xs text-muted">{ACCOUNT_NAME[p.account]}</td>
                <td className="text-xs text-muted">{p.assetClass}</td>
                <td className="text-right num">{formatAed(p.monthlyAed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DcaProgressList rows={snap.dca} />
    </div>
  );
}
