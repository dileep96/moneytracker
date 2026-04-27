import { AllocationChart } from "@/components/AllocationChart";
import { CashflowWaterfall } from "@/components/CashflowWaterfall";
import { DcaProgressList } from "@/components/DcaProgress";
import { HoldingsTable } from "@/components/HoldingsTable";
import { KpiCard } from "@/components/KpiCard";
import { PnlNoiseBanner } from "@/components/PnlNoiseBanner";
import { RebalanceAlerts } from "@/components/RebalanceAlerts";
import { RefreshButton } from "@/components/RefreshButton";
import { TargetProgress } from "@/components/TargetProgress";
import { ViewModeNote } from "@/components/ViewModeNote";
import { ACCOUNTS } from "@/data/plan";
import { getSetting } from "@/lib/db";
import { aedToUsd } from "@/lib/fx";
import { buildSnapshot } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

export default function Dashboard({ searchParams }: { searchParams: { view?: string } }) {
  const inrPerUsd = Number(getSetting("inr_per_usd") ?? 83);
  const snap = buildSnapshot({ inrPerUsd });
  const view = searchParams?.view === "daily" ? "daily" : "monthly";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <ViewModeNote mode={view} />
        </div>
        <RefreshButton />
      </div>

      <PnlNoiseBanner snap={snap} />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total portfolio" aed={snap.totalAed} usd={snap.totalUsd} hint={`as of ${new Date(snap.asOf).toLocaleDateString()}`} />
        <KpiCard label="Mashreq NEO" aed={snap.byAccount.neo.aed} usd={snap.byAccount.neo.usd} hint="emergency + cash + theme park" />
        <KpiCard label="ICICI NRI" aed={snap.byAccount.icici.aed} usd={snap.byAccount.icici.usd} hint="India equity SIP" />
        <KpiCard label="IBKR + crypto" aed={snap.byAccount.ibkr.aed + snap.byAccount.crypto.aed} usd={snap.byAccount.ibkr.usd + snap.byAccount.crypto.usd} hint="ETFs + BTC/ETH" />
      </section>

      <RebalanceAlerts rows={snap.allocations} />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AllocationChart rows={snap.allocations} />
        <TargetProgress totalAed={snap.totalAed} />
      </section>

      <CashflowWaterfall />

      <DcaProgressList rows={snap.dca} />

      <HoldingsTable snap={snap} />

      <section className="card text-xs text-muted">
        <div className="font-semibold text-text mb-1">Account roles</div>
        <ul className="space-y-1">
          {ACCOUNTS.map((a) => (
            <li key={a.id}>
              <span className="text-text">{a.name}:</span> {a.role}
              {a.interestApy ? <span className="text-good"> · {(a.interestApy * 100).toFixed(2)}% APY</span> : null}
            </li>
          ))}
        </ul>
        <div className="mt-3">USD↔AED treated as fixed at 3.6725 (peg). USD↔INR currently {inrPerUsd.toFixed(2)} (live, refreshed via Yahoo). Total USD checked: {aedToUsd(snap.totalAed).toFixed(0)}.</div>
      </section>
    </div>
  );
}
