import { NextResponse } from "next/server";
import { refreshAll } from "@/lib/refresh";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const report = await refreshAll();
    return NextResponse.json(report);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export async function GET() {
  return POST();
}
