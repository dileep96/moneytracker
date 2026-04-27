import { formatPct } from "@/lib/fx";
import type { AllocationRow } from "@/lib/types";

export function RebalanceAlerts({ rows }: { rows: AllocationRow[] }) {
  const alerts = rows.filter((r) => r.alert);
  if (alerts.length === 0) {
    return (
      <div className="card border-good/30 bg-good/5">
        <div className="text-sm">
          <span className="text-good font-medium">All buckets within ±5% of target.</span>
          <span className="text-muted"> Nothing to rebalance this month — let DCA do the work.</span>
        </div>
      </div>
    );
  }
  return (
    <div className="card border-warn/40 bg-warn/5">
      <h3 className="font-semibold text-warn mb-2">Rebalancing alerts</h3>
      <ul className="space-y-1 text-sm">
        {alerts.map((a) => (
          <li key={a.bucket} className="flex justify-between">
            <span>{a.bucket}</span>
            <span className="num">
              {formatPct(a.actualPct)} <span className="text-muted">vs target</span>{" "}
              {formatPct(a.targetPct)} <span className="text-warn">({a.driftPct >= 0 ? "+" : ""}{formatPct(a.driftPct)})</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="text-xs text-muted mt-2">
        Tilt next month&apos;s DCA toward under-allocated buckets before selling. Avoid selling unless drift &gt; 10%.
      </div>
    </div>
  );
}
