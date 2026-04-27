/**
 * Refresh holdings + prices once. Suitable for cron / launchd.
 * Usage: npm run refresh
 */

import { refreshAll } from "../lib/refresh";

async function main() {
  const report = await refreshAll();
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
