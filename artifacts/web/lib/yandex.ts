import type { ScheduleResponse, Segment, Station } from "./types";

const YANDEX_RASP_API_KEY =
  process.env.YANDEX_RASP_API_KEY || "a657f80d-9c96-4dc4-ab5b-8e74aac162de";
const RASP_BASE = "https://api.rasp.yandex.net/v3.0";

// Популярные станции для быстрого старта
export const POPULAR_STATIONS: Station[] = [
  { code: "s9600213", title: "Москва (Курский вокзал)", short_title: "Курская", region: "Москва" },
  { code: "s9601660", title: "Москва (Ярославский вокзал)", short_title: "Ярославская", region: "Москва" },
  { code: "s2000002", title: "Москва (Казанский вокзал)", short_title: "Казанская", region: "Москва" },
  { code: "s9602494", title: "Москва (Павелецкий вокзал)", short_title: "Павелецкая", region: "Москва" },
  { code: "s9601728", title: "Москва (Белорусский вокзал)", short_title: "Белорусская", region: "Москва" },
  { code: "s9600721", title: "Москва (Рижский вокзал)", short_title: "Рижская", region: "Москва" },
  { code: "s9603060", title: "Мытищи", short_title: "Мытищи", region: "Московская область" },
  { code: "s9600681", title: "Зеленоград-Крюково", short_title: "Крюково", region: "Московская область" },
  { code: "s9603134", title: "Подольск", short_title: "Подольск", region: "Московская область" },
  { code: "s9603133", title: "Одинцово", short_title: "Одинцово", region: "Московская область" },
  { code: "s9602463", title: "Санкт-Петербург (Финляндский вокзал)", short_title: "Финляндский", region: "Санкт-Петербург" },
  { code: "s9602494", title: "Санкт-Петербург (Балтийский вокзал)", short_title: "Балтийский", region: "Санкт-Петербург" },
];

export const POPULAR_ROUTES: Array<{ from: Station; to: Station; label: string }> = [
  {
    label: "Москва — Мытищи",
    from: { code: "s9601660", title: "Москва (Ярославская)" },
    to: { code: "s9603060", title: "Мытищи" },
  },
  {
    label: "Москва — Одинцово",
    from: { code: "s9601728", title: "Москва (Белорусская)" },
    to: { code: "s9603133", title: "Одинцово" },
  },
  {
    label: "Москва — Подольск",
    from: { code: "s9602494", title: "Москва (Павелецкая)" },
    to: { code: "s9603134", title: "Подольск" },
  },
  {
    label: "Москва — Зеленоград",
    from: { code: "s9601728", title: "Москва (Белорусская)" },
    to: { code: "s9600681", title: "Зеленоград-Крюково" },
  },
];

type YandexSegmentRaw = {
  thread?: {
    uid?: string;
    number?: string;
    title?: string;
    transport_subtype?: { title?: string };
    express_type?: string | null;
  };
  departure?: string;
  arrival?: string;
  duration?: number;
  from?: { codes?: { yandex_code?: string }; title?: string; short_title?: string; popular_title?: string };
  to?: { codes?: { yandex_code?: string }; title?: string; short_title?: string; popular_title?: string };
  has_transfers?: boolean;
  tickets_info?: { places?: Array<{ price?: { whole?: number } }> };
};

export async function fetchSchedule(
  from: string,
  to: string,
  date: string,
): Promise<ScheduleResponse> {
  const url =
    `${RASP_BASE}/search/?apikey=${YANDEX_RASP_API_KEY}` +
    `&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` +
    `&date=${date}&transport_types=suburban&format=json&lang=ru_RU&limit=100`;

  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) {
    return emptySchedule(from, to, date);
  }
  const data = (await res.json()) as {
    search?: { from?: any; to?: any; date?: string };
    segments?: YandexSegmentRaw[];
  };

  const segments: Segment[] = (data.segments || []).map((seg, idx) => {
    const thread = seg.thread || {};
    const prices = seg.tickets_info?.places || [];
    const priceValues = prices
      .map((p) => p?.price?.whole)
      .filter((v): v is number => typeof v === "number");

    return {
      uid: thread.uid || `seg-${idx}`,
      number: thread.number || "",
      title: thread.title || "",
      departure: seg.departure || "",
      arrival: seg.arrival || "",
      duration: seg.duration || 0,
      has_transfers: Boolean(seg.has_transfers),
      from_station: {
        code: seg.from?.codes?.yandex_code || from,
        title: seg.from?.title || "",
        short_title: seg.from?.short_title,
        popular_title: seg.from?.popular_title,
      },
      to_station: {
        code: seg.to?.codes?.yandex_code || to,
        title: seg.to?.title || "",
        short_title: seg.to?.short_title,
        popular_title: seg.to?.popular_title,
      },
      price_min: priceValues.length ? Math.min(...priceValues) : null,
      price_max: priceValues.length ? Math.max(...priceValues) : null,
      transport_subtype: thread.transport_subtype?.title || null,
      thread_express_type: thread.express_type || null,
    };
  });

  return {
    date: data.search?.date || date,
    from: {
      code: from,
      title: data.search?.from?.title || from,
      popular_title: data.search?.from?.popular_title,
    },
    to: {
      code: to,
      title: data.search?.to?.title || to,
      popular_title: data.search?.to?.popular_title,
    },
    segments,
  };
}

function emptySchedule(from: string, to: string, date: string): ScheduleResponse {
  return {
    date,
    from: { code: from, title: from },
    to: { code: to, title: to },
    segments: [],
  };
}

// Локальный поиск по локальному индексу + быстрый результат для популярных
// В реальном продакшене сюда можно подключить stations_list.json (~40MB).
export async function searchStations(query: string): Promise<Station[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const localMatches = POPULAR_STATIONS.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      (s.short_title && s.short_title.toLowerCase().includes(q)) ||
      (s.region && s.region.toLowerCase().includes(q)),
  );

  return localMatches.slice(0, 30);
}

export function estimateBasePrice(durationSec: number): number {
  // Оценочная цена при отсутствии данных от API: 60 руб + 3 руб за минуту
  const minutes = Math.max(10, Math.round(durationSec / 60));
  const raw = 60 + minutes * 3;
  return Math.round(raw / 5) * 5;
}
