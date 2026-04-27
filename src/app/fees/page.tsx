import { FEE_REFERENCE } from "@/data/plan";
import { formatBps } from "@/lib/fx";

export const dynamic = "force-dynamic";

export default function FeesPage() {
  const sorted = [...FEE_REFERENCE].sort((a, b) => a.bpsPerYear - b.bpsPerYear);
  const max = Math.max(...sorted.map((f) => f.bpsPerYear));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Fee comparison</h1>
      <div className="card">
        <p className="text-sm text-muted mb-3">
          Total expense ratio (TER) per year, in basis points. Lower is better. Cheaper core (CSPX, VWRA) makes the
          thematic fee load (RBOT/ARKE/FOOD) tolerable, but ARKE at 75 bps is the tax you pay for narrative exposure —
          keep that bucket small.
        </p>
        <ul className="space-y-2">
          {sorted.map((f) => (
            <li key={f.label} className="text-sm">
              <div className="flex justify-between">
                <span>{f.label}</span>
                <span className="num">{formatBps(f.bpsPerYear)}</span>
              </div>
              <div className="h-1.5 bg-line rounded mt-1 overflow-hidden">
                <div
                  className={`h-full ${f.bpsPerYear < 25 ? "bg-good" : f.bpsPerYear < 60 ? "bg-accent" : "bg-warn"}`}
                  style={{ width: `${(f.bpsPerYear / max) * 100}%` }}
                />
              </div>
              {f.notes ? <div className="text-xs text-muted mt-1">{f.notes}</div> : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
