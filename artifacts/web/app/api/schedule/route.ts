import { NextResponse } from "next/server";
import { fetchSchedule } from "@/lib/yandex";
import { todayIso } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const date = searchParams.get("date") || todayIso();

  if (!from || !to) {
    return NextResponse.json(
      { error: "Параметры from и to обязательны" },
      { status: 400 },
    );
  }

  try {
    const data = await fetchSchedule(from, to, date);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("[v0] schedule error", err);
    return NextResponse.json(
      {
        date,
        from: { code: from, title: from },
        to: { code: to, title: to },
        segments: [],
      },
      { status: 200 },
    );
  }
}
