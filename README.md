# Money Tracker

A personal investment tracker dashboard for a Dubai-based UAE expat running a four-app stack:
**Mashreq NEO Plus**, **Emirates NBD**, **ICICI Direct NRI**, and **Interactive Brokers**
(plus IBKR/Paxos crypto). All values are shown side-by-side in **AED** and **USD**, with the
peg locked at **3.6725 AED/USD**.

The dashboard is built around three principles:

1. **Default to monthly views** to discourage panic-checking inside a 5–7 year horizon.
2. **Treat entry-day P&L as bid-ask spread, not a loss** — fresh UCITS positions are flagged
   so red on day one isn't read as a real drawdown.
3. **Rebalance via DCA, not via selling.** A drift alert fires when any allocation bucket is
   off target by more than ±5%.

## Stack

- **Next.js 14** (App Router, TypeScript) — single deployable app.
- **Tailwind** + **Recharts** for the UI.
- **better-sqlite3** for local persistence (`./data/tracker.db`, gitignored).
- **fast-xml-parser** for IBKR Flex XML.
- **yahoo-finance2**, **CoinGecko REST**, **AMFI India NAV** for price feeds.

## IBKR API choice

For a personal portfolio tracker, the **Flex Web Service** is the right IBKR API:

- **Flex Web Service** (used here) — small, standalone HTTPS API. You configure a Flex Query
  template once in Client Portal (Open Positions + Cash Report + Trades + NAV); the program
  fetches up-to-date XML with a token + query ID. **No TWS/Gateway** needs to be running.
  Daily-update cadence aligns with the "monthly default" UX rule.
- **Client Portal Web API** — better for intra-day quotes but requires running the Client
  Portal Gateway locally and re-auth every ~24h. We can layer this on later if you ever want
  a live ticker.
- **TWS / IB Gateway native API** — needs the desktop app running. Wrong fit for a
  background tracker.

The Flex client lives at `src/lib/ibkr/flex.ts`. It implements the standard two-step protocol
(`SendRequest` → `GetStatement`) with retry on the "still generating" warning.

## Setup

```bash
# 1. Install deps
npm install

# 2. Configure .env (copy .env.example and fill in)
cp .env.example .env

# 3. Seed the DB with the planned holdings (zero quantity)
npm run seed

# 4. Pull live prices + IBKR positions
npm run refresh

# 5. Run the dashboard
npm run dev
# open http://localhost:3000
```

### IBKR Flex configuration

1. Log into Client Portal → **Performance & Reports → Flex Queries**.
2. Create a **Custom Flex Query** that includes:
   - Open Positions (symbol, currency, position, costBasisPrice, markPrice, fifoPnlUnrealized)
   - Cash Report (currency, endingCash)
   - Trades (for first-acquired-at)
   - NAV / Equity Summary in Base
3. Note the **Query ID**.
4. Under **Flex Web Service**, generate a token (valid 6 hours by default — refresh weekly).
5. Drop both into `.env`:
   ```
   IBKR_FLEX_TOKEN=...
   IBKR_FLEX_QUERY_ID=...
   ```

### Cron / launchd (optional)

Run `npm run refresh` once a day after market close in your timezone. The Flex query and
AMFI NAV both update once daily; running more often only burns the IBKR token earlier.

```bash
# crontab example: 18:00 GST (14:00 UTC), Mon–Fri
0 14 * * 1-5 cd /path/to/moneytracker && /usr/local/bin/npm run refresh >> data/refresh.log 2>&1
```

## File map

```
src/
├── app/                  # Next.js routes
│   ├── page.tsx          # /         dashboard
│   ├── holdings/         # /holdings
│   ├── allocation/       # /allocation
│   ├── cashflow/         # /cashflow
│   ├── fees/             # /fees
│   ├── settings/         # /settings
│   └── api/
│       ├── refresh/      # POST -> pulls IBKR + price feeds
│       ├── snapshot/     # GET  -> JSON of current state
│       └── dca/          # POST -> log a DCA contribution
├── components/           # KpiCard, HoldingsTable, AllocationChart,
│                         # CashflowWaterfall, DcaProgress, RebalanceAlerts,
│                         # PnlNoiseBanner, TargetProgress, RefreshButton
├── lib/
│   ├── db.ts             # SQLite + migrations
│   ├── fx.ts             # AED/USD peg + formatters
│   ├── snapshot.ts       # build the dashboard payload
│   ├── refresh.ts        # one-shot pull from all sources
│   ├── ibkr/flex.ts      # IBKR Flex Web Service client
│   └── prices/
│       ├── yahoo.ts      # LSE-listed UCITS (CSPX.L, VWRA.L, ...)
│       ├── coingecko.ts  # BTC, ETH
│       └── amfi.ts       # Indian MF NAV + USD/INR
├── data/plan.ts          # the user's plan as data — edit to retune
└── scripts/
    ├── seed.ts           # npm run seed
    └── refresh.ts        # npm run refresh
```

## What gets shown

- **Top KPIs**: total portfolio (AED + USD), per-account totals.
- **Rebalance alerts**: flags any of the six allocation buckets > ±5% off target.
- **Allocation pie + table**: current vs target by bucket, with drift markers.
- **Trajectory bars**: progress vs Year-3 (~540K AED) and Year-5 (~1M AED) targets.
- **Cash-flow waterfall**: 25K → 10K loan → 5.5K living → 5K savings → 4.5K investing.
- **DCA progress**: per-symbol month-to-date vs monthly target, with on-track / behind / ahead status.
- **Holdings table**: every position with quantity, last price, AED value, USD value, P&L %,
  and a "spread" tag for fresh entry-day rows.
- **Fees**: TER comparison across the ETF stack.

## Tweaking the plan

Everything user-specific lives in [`src/data/plan.ts`](src/data/plan.ts):

- `SALARY_AED`, `CASHFLOW_WATERFALL`
- `ACCOUNTS` — Mashreq NEO, ENBD, ICICI NRI, IBKR, IBKR/Paxos crypto
- `PLANNED_HOLDINGS` — every symbol, asset class, monthly DCA amount, and price source
- `ALLOCATION_TARGETS` — six target buckets with a default ±5% drift tolerance
- `TARGETS` — Year-3 / Year-5 portfolio targets
- `FEE_REFERENCE` — TER table

Edit and re-run `npm run seed` to apply structural changes.

## Caveats

- **Avg cost** for Indian MFs and ENBD Gold needs manual entry the first time (Flex doesn't
  cover them). Once entered in `holdings.avg_cost_native`, it survives refreshes.
- **GBp vs USD** on LSE: the UCITS lines we track (`CSPX.L`, `VWRA.L`, `EIMI.L`, `SGLN.L`,
  `RBOT.L`, `ARKE.L`, `FOOD.L`) are USD-quoted on the IOB segment, so currency conversion is
  a no-op for them. If you switch to a GBp-quoted line, flip its `currency` to `GBX` in
  `plan.ts`.
- **Daily view** is intentionally one click away. The default page is monthly to keep you
  from refreshing five times a day.
