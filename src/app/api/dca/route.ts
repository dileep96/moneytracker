import { NextResponse } from "next/server";
import { z } from "zod";
import { logDca } from "@/lib/db";

export const runtime = "nodejs";

const Body = z.object({
  symbol: z.string().min(1),
  amountAed: z.number().positive(),
  note: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { symbol, amountAed, note } = Body.parse(json);
    logDca(symbol, amountAed, note);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 400 },
    );
  }
}
