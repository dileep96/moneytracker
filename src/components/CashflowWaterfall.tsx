"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CASHFLOW_WATERFALL } from "@/data/plan";
import { formatAed } from "@/lib/fx";

interface BarRow {
  label: string;
  base: number; // invisible bar so the visible bar starts at the right place
  delta: number; // visible portion (always positive)
  raw: number;
  isOutflow: boolean;
  isStart: boolean;
}

function buildRows(): BarRow[] {
  let running = 0;
  const rows: BarRow[] = [];
  for (const step of CASHFLOW_WATERFALL) {
    if (step.amount > 0) {
      // inflow (typically the salary credit)
      rows.push({
        label: step.label,
        base: 0,
        delta: step.amount,
        raw: step.amount,
        isOutflow: false,
        isStart: running === 0,
      });
      running += step.amount;
    } else {
      const next = running + step.amount; // step.amount is negative
      rows.push({
        label: step.label,
        base: next,
        delta: -step.amount,
        raw: step.amount,
        isOutflow: true,
        isStart: false,
      });
      running = next;
    }
  }
  rows.push({
    label: "Net (target = 0)",
    base: 0,
    delta: Math.abs(running),
    raw: running,
    isOutflow: false,
    isStart: false,
  });
  return rows;
}

export function CashflowWaterfall() {
  const data = buildRows();
  return (
    <div className="card">
      <h3 className="font-semibold mb-1">Salary cash-flow waterfall (monthly, AED)</h3>
      <div className="text-xs text-muted mb-3">
        25,000 → 10,000 ENBD loan → 5,500 living → 5,000 NEO savings → 4,500 deployed (ENBD Gold + ICICI SIP + IBKR + crypto).
      </div>
      <div className="h-72">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 16, bottom: 30, left: 16 }}>
            <CartesianGrid stroke="#1f2a52" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8892b0" }} interval={0} angle={-15} textAnchor="end" />
            <YAxis tick={{ fontSize: 11, fill: "#8892b0" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: "#121833", border: "1px solid #1f2a52", borderRadius: 12 }}
              formatter={(_v, _n, p) => formatAed((p.payload as BarRow).raw)}
              labelFormatter={(l) => l as string}
            />
            <Bar dataKey="base" stackId="a" fill="transparent" />
            <Bar dataKey="delta" stackId="a">
              {data.map((d, i) => (
                <Cell key={i} fill={d.isStart ? "#6ea8fe" : d.isOutflow ? "#ff6b6b" : "#3ddc97"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
