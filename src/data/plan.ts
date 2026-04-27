/**
 * The user's investment plan, encoded as data.
 * Edit this file to update target allocations, accounts, or monthly DCA amounts.
 *
 * All monetary values are in AED unless suffixed with `Usd`.
 * AED is pegged to USD at 3.6725 (see fx.ts).
 */

export type AccountId = "neo" | "enbd" | "icici" | "ibkr" | "crypto";

export type AssetClass =
  | "cash"
  | "emergency"
  | "debt_repayment"
  | "equity_etf"
  | "equity_mf"
  | "gold"
  | "thematic"
  | "crypto";

export type PriceSource =
  | "manual"
  | "ibkr_flex"
  | "yahoo"
  | "coingecko"
  | "amfi"
  | "static_aed";

export interface PlannedHolding {
  symbol: string;
  name: string;
  account: AccountId;
  assetClass: AssetClass;
  currency: "AED" | "USD" | "INR" | "GBp";
  monthlyAed: number;
  source: PriceSource;
  /** External lookup id: yahoo ticker, coingecko id, AMFI scheme code. */
  sourceId?: string;
  notes?: string;
}

export interface AccountInfo {
  id: AccountId;
  name: string;
  role: string;
  institution: string;
  interestApy?: number;
}

export interface AllocationTarget {
  bucket: string;
  targetPct: number;
  /** asset classes that count toward this bucket */
  classes: AssetClass[];
  driftToleranceBps?: number; // default 500 bps = 5%
}

export const SALARY_AED = 25_000;

export const CASHFLOW_WATERFALL: { label: string; amount: number; account?: AccountId }[] = [
  { label: "Salary credit", amount: 25_000, account: "neo" },
  { label: "ENBD loan auto-debit", amount: -10_000, account: "enbd" },
  { label: "Living expenses", amount: -5_500 },
  { label: "Savings (NEO Plus 6.25%)", amount: -5_000, account: "neo" },
  { label: "Investing (ENBD Gold + ICICI SIP + IBKR + crypto)", amount: -4_500 },
];

export const ACCOUNTS: AccountInfo[] = [
  {
    id: "neo",
    name: "Mashreq NEO Plus",
    role: "Salary inflow + emergency fund + thematic deployment park",
    institution: "Mashreq Bank",
    interestApy: 0.0625,
  },
  {
    id: "enbd",
    name: "Emirates NBD",
    role: "10K AED loan auto-debit, ENBD Gold Account, USD wires to IBKR",
    institution: "Emirates NBD",
  },
  {
    id: "icici",
    name: "ICICI Direct NRI",
    role: "Indian MF SIP via NRE",
    institution: "ICICI Securities (India)",
  },
  {
    id: "ibkr",
    name: "Interactive Brokers",
    role: "Global ETFs (LSE UCITS) and gold; investment hub",
    institution: "Interactive Brokers UK",
  },
  {
    id: "crypto",
    name: "IBKR Crypto (Paxos)",
    role: "BTC + ETH spot",
    institution: "Paxos via IBKR",
  },
];

/**
 * Monthly DCA plan that sums to 9,000 AED of deployment plus a 4,000+1,000 AED
 * cash allocation in NEO. Edit the monthlyAed values to retune.
 */
export const PLANNED_HOLDINGS: PlannedHolding[] = [
  // Mashreq NEO Plus -- savings buckets
  {
    symbol: "NEO_EF",
    name: "Emergency fund (NEO Plus)",
    account: "neo",
    assetClass: "emergency",
    currency: "AED",
    monthlyAed: 4_000,
    source: "static_aed",
    notes: "Held until 6 months of living expenses are reached, then redirected.",
  },
  {
    symbol: "NEO_BUF",
    name: "Cash buffer (NEO Plus)",
    account: "neo",
    assetClass: "cash",
    currency: "AED",
    monthlyAed: 1_000,
    source: "static_aed",
  },
  {
    symbol: "NEO_THEME",
    name: "Thematic deployment park (NEO Plus)",
    account: "neo",
    assetClass: "cash",
    currency: "AED",
    monthlyAed: 1_000,
    source: "static_aed",
    notes: "Parked monthly, deployed quarterly into IBKR thematic ETFs (RBOT/ARKE/FOOD).",
  },

  // Emirates NBD
  {
    symbol: "ENBD_GOLD",
    name: "ENBD Gold Account",
    account: "enbd",
    assetClass: "gold",
    currency: "AED",
    monthlyAed: 500,
    source: "static_aed",
    notes: "Tracks AED-denominated gold balance via ENBD; price moves with XAU.",
  },

  // ICICI Direct NRI -- 2,000 AED SIP via NRE (split per prompt: 35/30/20/15)
  {
    symbol: "INF209K01YM2",
    name: "UTI Nifty 50 Index Fund",
    account: "icici",
    assetClass: "equity_mf",
    currency: "INR",
    monthlyAed: 700, // 35% of 2,000 AED
    source: "amfi",
    sourceId: "120716",
  },
  {
    symbol: "INF879O01019",
    name: "Parag Parikh Flexi Cap Fund",
    account: "icici",
    assetClass: "equity_mf",
    currency: "INR",
    monthlyAed: 600, // 30%
    source: "amfi",
    sourceId: "122639",
  },
  {
    symbol: "INF179K01YV8",
    name: "HDFC Flexi Cap Fund",
    account: "icici",
    assetClass: "equity_mf",
    currency: "INR",
    monthlyAed: 400, // 20%
    source: "amfi",
    sourceId: "118989",
  },
  {
    symbol: "INF179K01XS6",
    name: "HDFC Mid-Cap Opportunities Fund",
    account: "icici",
    assetClass: "equity_mf",
    currency: "INR",
    monthlyAed: 300, // 15%
    source: "amfi",
    sourceId: "118989",
  },

  // Interactive Brokers -- LSE-listed UCITS USD ETFs (5,000 AED total)
  {
    symbol: "CSPX.L",
    name: "iShares Core S&P 500 UCITS (USD)",
    account: "ibkr",
    assetClass: "equity_etf",
    currency: "USD",
    monthlyAed: 1_500,
    source: "yahoo",
    sourceId: "CSPX.L",
  },
  {
    symbol: "VWRA.L",
    name: "Vanguard FTSE All-World UCITS (USD)",
    account: "ibkr",
    assetClass: "equity_etf",
    currency: "USD",
    monthlyAed: 900,
    source: "yahoo",
    sourceId: "VWRA.L",
  },
  {
    symbol: "EIMI.L",
    name: "iShares Core MSCI EM IMI UCITS (USD)",
    account: "ibkr",
    assetClass: "equity_etf",
    currency: "USD",
    monthlyAed: 600,
    source: "yahoo",
    sourceId: "EIMI.L",
  },
  {
    symbol: "SGLN.L",
    name: "iShares Physical Gold ETC (USD)",
    account: "ibkr",
    assetClass: "gold",
    currency: "USD",
    monthlyAed: 1_000,
    source: "yahoo",
    sourceId: "SGLN.L",
  },
  {
    symbol: "RBOT.L",
    name: "iShares Automation & Robotics UCITS (USD)",
    account: "ibkr",
    assetClass: "thematic",
    currency: "USD",
    monthlyAed: 500,
    source: "yahoo",
    sourceId: "RBOT.L",
    notes: "Quarterly thematic deployment from NEO theme park.",
  },
  {
    symbol: "ARKE.L",
    name: "ARK Innovation UCITS ETF",
    account: "ibkr",
    assetClass: "thematic",
    currency: "USD",
    monthlyAed: 300,
    source: "yahoo",
    sourceId: "ARKE.L",
  },
  {
    symbol: "FOOD.L",
    name: "Rize Sustainable Future of Food UCITS ETF",
    account: "ibkr",
    assetClass: "thematic",
    currency: "USD",
    monthlyAed: 200,
    source: "yahoo",
    sourceId: "FOOD.L",
  },

  // Crypto via IBKR/Paxos
  {
    symbol: "BTC",
    name: "Bitcoin",
    account: "crypto",
    assetClass: "crypto",
    currency: "USD",
    monthlyAed: 350,
    source: "coingecko",
    sourceId: "bitcoin",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    account: "crypto",
    assetClass: "crypto",
    currency: "USD",
    monthlyAed: 150,
    source: "coingecko",
    sourceId: "ethereum",
  },
];

/**
 * Target allocation buckets.
 * The "investing-only" view excludes cash + emergency + debt repayment.
 * Drift alert fires when the bucket is more than ±5% from target.
 */
export const ALLOCATION_TARGETS: AllocationTarget[] = [
  { bucket: "Cash & emergency", classes: ["cash", "emergency"], targetPct: 0.20 },
  { bucket: "Global equity ETFs (DM)", classes: ["equity_etf"], targetPct: 0.30 },
  { bucket: "India equity MFs", classes: ["equity_mf"], targetPct: 0.15 },
  { bucket: "Gold", classes: ["gold"], targetPct: 0.15 },
  { bucket: "Thematic ETFs", classes: ["thematic"], targetPct: 0.10 },
  { bucket: "Crypto", classes: ["crypto"], targetPct: 0.10 },
];

export const TARGETS = {
  year3Aed: 540_000,
  year3Usd: 147_000,
  year5Aed: 1_000_000,
  year5Usd: 272_000,
};

/**
 * Day-1 P&L noise threshold. Holdings opened within the last `entryDayHours`
 * are flagged as "spread noise, not loss" in the UI.
 */
export const PNL_NOISE = {
  entryDayHours: 36,
  spreadBps: 30, // typical UCITS bid-ask
};

export const FEE_REFERENCE: { label: string; bpsPerYear: number; notes?: string }[] = [
  { label: "CSPX (S&P 500 UCITS)", bpsPerYear: 7 },
  { label: "VWRA (FTSE All-World UCITS)", bpsPerYear: 22 },
  { label: "EIMI (MSCI EM IMI UCITS)", bpsPerYear: 18 },
  { label: "SGLN (iShares Gold ETC)", bpsPerYear: 12 },
  { label: "RBOT (Automation & Robotics)", bpsPerYear: 40 },
  { label: "ARKE (ARK Innovation UCITS)", bpsPerYear: 75 },
  { label: "FOOD (Sustainable Future of Food)", bpsPerYear: 45 },
  { label: "UTI Nifty 50 (direct)", bpsPerYear: 20 },
  { label: "Parag Parikh Flexi Cap (direct)", bpsPerYear: 65 },
  { label: "HDFC Flexi Cap (direct)", bpsPerYear: 80 },
  { label: "HDFC Mid-Cap Opportunities (direct)", bpsPerYear: 90 },
  { label: "ENBD Gold Account spread (one-way)", bpsPerYear: 35, notes: "Wider than SGLN; review annually." },
];
