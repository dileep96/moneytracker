import { ACCOUNTS } from "@/data/plan";
import { formatAed, formatPct } from "@/lib/fx";
import type { DcaProgress } from "@/lib/types";

const ACCOUNT_NAME = Object.fromEntries(ACCOUNTS.map((a) => [a.id, a.name]));

export function DcaProgressList({ rows }: { rows: DcaProgress[] }) {
  const totalTarget = rows.reduce((s, r) => s + r.monthlyTargetAed, 0);
  const totalMtd = rows.reduce((s, r) => s + r.monthToDateAed, 0);
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Monthly DCA progress</h3>
        <span className="text-sm text-muted num">
          {formatAed(totalMtd)} / {formatAed(totalTarget)} ({formatPct(totalTarget > 0 ? totalMtd / totalTarget : 0)})
        </span>
      </div>
      <div className="space-y-2">
        {rows.map((r) => {
          const pct = Math.max(0, Math.min(1, r.pct));
          const tone =
            r.status === "behind" ? "bg-warn" : r.status === "ahead" ? "bg-good" : "bg-accent";
          return (
            <div key={r.symbol} className="text-sm">
              <div className="flex justify-between">
                <span>
                  <span className="font-medium">{r.symbol}</span>
                  <span className="text-muted ml-2 text-xs">{ACCOUNT_NAME[r.account]}</span>
                </span>
                <span className="num text-muted">
                  {formatAed(r.monthToDateAed)} / {formatAed(r.monthlyTargetAed)}
                </span>
              </div>
              <div className="h-1.5 bg-line rounded mt-1 overflow-hidden">
                <div className={`h-full ${tone}`} style={{ width: `${pct * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
