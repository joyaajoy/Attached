import { NextResponse } from "next/server";
import { searchStations } from "@/lib/yandex";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const stations = await searchStations(q);
  return NextResponse.json({ stations });
}
