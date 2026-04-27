import { NextResponse } from "next/server";
import { getSetting } from "@/lib/db";
import { buildSnapshot } from "@/lib/snapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const inrPerUsd = Number(getSetting("inr_per_usd") ?? 83);
  return NextResponse.json(buildSnapshot({ inrPerUsd }));
}
