/**
 * Banner reinforcing the "monthly view default" UX rule. Click the link
 * to switch into a daily view; otherwise the dashboard stays calm.
 */

import Link from "next/link";

export function ViewModeNote({ mode = "monthly" }: { mode?: "monthly" | "daily" }) {
  if (mode === "daily") {
    return (
      <div className="text-xs text-warn">
        Daily view enabled. Daily moves are noise inside a 5–7y horizon.{" "}
        <Link href="/" className="underline">Back to monthly</Link>
      </div>
    );
  }
  return (
    <div className="text-xs text-muted">
      Showing monthly view. Daily price wiggles are filtered out by design.{" "}
      <Link href="/?view=daily" className="underline hover:text-text">Show daily anyway</Link>
    </div>
  );
}
