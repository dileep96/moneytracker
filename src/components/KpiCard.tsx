import { formatAed, formatUsd } from "@/lib/fx";

interface Props {
  label: string;
  aed?: number;
  usd?: number;
  hint?: string;
  tone?: "neutral" | "good" | "bad" | "warn";
}

export function KpiCard({ label, aed, usd, hint, tone = "neutral" }: Props) {
  const toneClass =
    tone === "good"
      ? "text-good"
      : tone === "bad"
      ? "text-bad"
      : tone === "warn"
      ? "text-warn"
      : "text-text";
  return (
    <div className="kpi">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-2 num text-2xl ${toneClass}`}>
        {aed !== undefined ? formatAed(aed) : usd !== undefined ? formatUsd(usd) : "—"}
      </div>
      {usd !== undefined && aed !== undefined ? (
        <div className="text-sm text-muted num mt-0.5">{formatUsd(usd)}</div>
      ) : null}
      {hint ? <div className="text-xs text-muted mt-2">{hint}</div> : null}
    </div>
  );
}
