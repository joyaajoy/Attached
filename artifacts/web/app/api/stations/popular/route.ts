import { NextResponse } from "next/server";
import { POPULAR_STATIONS, POPULAR_ROUTES } from "@/lib/yandex";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    stations: POPULAR_STATIONS,
    routes: POPULAR_ROUTES,
  });
}
