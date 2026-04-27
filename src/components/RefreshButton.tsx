"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    setMsg(null);
    const res = await fetch("/api/refresh", { method: "POST" });
    if (!res.ok) {
      setMsg(`Refresh failed: ${res.status}`);
      return;
    }
    const json = await res.json();
    setMsg(
      `Refreshed. IBKR ${json.ibkr.ok ? "✓" : "✗"} · Yahoo ${json.yahoo.ok ? "✓" : "✗"} · Crypto ${
        json.crypto.ok ? "✓" : "✗"
      } · AMFI ${json.amfi.ok ? "✓" : "✗"}`,
    );
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-3">
      <button className="btn" onClick={refresh} disabled={isPending}>
        {isPending ? "Refreshing…" : "Refresh prices"}
      </button>
      {msg ? <span className="text-xs text-muted">{msg}</span> : null}
    </div>
  );
}
