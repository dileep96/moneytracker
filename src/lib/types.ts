import type { AccountId, AssetClass, PriceSource } from "@/data/plan";

export type ViewMode = "monthly" | "daily";

export interface Holding {
  symbol: string;
  name: string;
  account: AccountId;
  assetClass: AssetClass;
  currency: string;
  quantity: number;
  avgCostNative: number; // in native currency
  lastPriceNative: number;
  lastPriceAt: string; // ISO
  source: PriceSource;
  sourceId?: string;
  firstAcquiredAt?: string; // ISO; used for entry-day P&L noise gating
  notes?: string;
}

export interface Money {
  aed: number;
  usd: number;
}

export interface AllocationRow {
  bucket: string;
  classes: AssetClass[];
  targetPct: number;
  actualPct: number;
  driftPct: number; // actual - target, in absolute pct points
  alert: boolean;
  valueAed: number;
  valueUsd: number;
}

export interface DcaProgress {
  symbol: string;
  name: string;
  account: AccountId;
  monthlyTargetAed: number;
  monthToDateAed: number;
  pct: number;
  status: "on_track" | "behind" | "ahead";
}

export interface PortfolioSnapshot {
  asOf: string;
  totalAed: number;
  totalUsd: number;
  byAccount: Record<AccountId, Money>;
  byAssetClass: Record<AssetClass, Money>;
  holdings: (Holding & { valueAed: number; valueUsd: number; pnlNative: number; pnlPctNative: number; entryDayNoise: boolean })[];
  allocations: AllocationRow[];
  dca: DcaProgress[];
}
