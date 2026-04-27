import { TARGETS } from "@/data/plan";
import { formatAed, formatPct, formatUsd } from "@/lib/fx";

export function TargetProgress({ totalAed }: { totalAed: number }) {
  const y3Pct = Math.max(0, Math.min(1, totalAed / TARGETS.year3Aed));
  const y5Pct = Math.max(0, Math.min(1, totalAed / TARGETS.year5Aed));
  return (
    <div className="card">
      <h3 className="font-semibold mb-3">Trajectory vs targets</h3>
      <Row
        label="Year 3"
        targetAed={TARGETS.year3Aed}
        targetUsd={TARGETS.year3Usd}
        actualAed={totalAed}
        pct={y3Pct}
      />
      <div className="h-3" />
      <Row
        label="Year 5 (post-loan)"
        targetAed={TARGETS.year5Aed}
        targetUsd={TARGETS.year5Usd}
        actualAed={totalAed}
        pct={y5Pct}
      />
    </div>
  );
}

function Row({
  label,
  targetAed,
  targetUsd,
  actualAed,
  pct,
}: {
  label: string;
  targetAed: number;
  targetUsd: number;
  actualAed: number;
  pct: number;
}) {
  return (
    <div className="text-sm">
      <div className="flex justify-between mb-1">
        <span className="text-muted">{label}</span>
        <span className="num">
          {formatAed(actualAed, { compact: true })}{" "}
          <span className="text-muted">/ {formatAed(targetAed, { compact: true })} ({formatUsd(targetUsd, { compact: true })})</span>
        </span>
      </div>
      <div className="h-2 bg-line rounded overflow-hidden">
        <div className="h-full bg-accent" style={{ width: `${pct * 100}%` }} />
      </div>
      <div className="text-xs text-muted mt-1">{formatPct(pct)} of target</div>
    </div>
  );
}
