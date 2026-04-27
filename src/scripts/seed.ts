/**
 * Seed the SQLite DB with the user's planned holdings at zero quantity.
 * After seeding, run `npm run refresh` to populate prices and (if the IBKR
 * Flex token is set) actual quantities.
 *
 * Usage: npm run seed
 */

import { PLANNED_HOLDINGS } from "../data/plan";
import { upsertHolding } from "../lib/db";

function main() {
  for (const h of PLANNED_HOLDINGS) {
    upsertHolding({
      symbol: h.symbol,
      name: h.name,
      account: h.account,
      asset_class: h.assetClass,
      currency: h.currency,
      quantity: 0,
      avg_cost_native: 0,
      last_price_native: h.source === "static_aed" ? 1 : 0,
      last_price_at: new Date().toISOString(),
      source: h.source,
      source_id: h.sourceId ?? null,
      notes: h.notes ?? null,
    });
  }
  console.log(`Seeded ${PLANNED_HOLDINGS.length} holdings.`);
}

main();
