import type { PortfolioSnapshot } from "@/lib/types";

export function PnlNoiseBanner({ snap }: { snap: PortfolioSnapshot }) {
  const noisy = snap.holdings.filter((h) => h.entryDayNoise);
  if (noisy.length === 0) return null;
  return (
    <div className="card border-accent/30 bg-accent/5 text-sm">
      <span className="font-medium text-accent">Heads up:</span>{" "}
      <span className="text-muted">
        {noisy.length} position{noisy.length === 1 ? "" : "s"} opened in the last ~36h ({noisy.map((n) => n.symbol).join(", ")}).
        Their red P&amp;L is just bid-ask spread — UCITS ETFs typically show ~30 bps the day you buy. Not a loss.
      </span>
    </div>
  );
}
