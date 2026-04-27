"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatAed, formatPct } from "@/lib/fx";
import type { AllocationRow } from "@/lib/types";

const COLORS = ["#6ea8fe", "#3ddc97", "#ffb86b", "#c792ea", "#ff6b6b", "#82e0aa", "#aab8d4"];

export function AllocationChart({ rows }: { rows: AllocationRow[] }) {
  const data = rows.map((r) => ({ name: r.bucket, value: r.valueAed, drift: r.driftPct, alert: r.alert }));
  return (
    <div className="card">
      <h3 className="font-semibold mb-3">Current vs target allocation</h3>
      <div className="h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#0b1020" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#121833", border: "1px solid #1f2a52", borderRadius: 12 }}
              formatter={(value: number) => formatAed(Number(value))}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 space-y-1">
        {rows.map((r) => (
          <div key={r.bucket} className="flex items-center justify-between text-sm">
            <span className="text-muted">{r.bucket}</span>
            <span className="num">
              {formatPct(r.actualPct)} <span className="text-muted">/ target {formatPct(r.targetPct)}</span>{" "}
              {r.alert ? (
                <span className="tag border-warn/40 text-warn">drift {formatPct(r.driftPct)}</span>
              ) : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
