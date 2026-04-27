import { AllocationChart } from "@/components/AllocationChart";
import { RebalanceAlerts } from "@/components/RebalanceAlerts";
import { TargetProgress } from "@/components/TargetProgress";
import { getSetting } from "@/lib/db";
import { buildSnapshot } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

export default function AllocationPage() {
  const inrPerUsd = Number(getSetting("inr_per_usd") ?? 83);
  const snap = buildSnapshot({ inrPerUsd });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Allocation</h1>
      <RebalanceAlerts rows={snap.allocations} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AllocationChart rows={snap.allocations} />
        <TargetProgress totalAed={snap.totalAed} />
      </div>
    </div>
  );
}
