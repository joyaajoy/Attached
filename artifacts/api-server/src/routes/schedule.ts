import { Router, type IRouter } from "express";

const router: IRouter = Router();

const YANDEX_RASP_API_KEY = "a657f80d-9c96-4dc4-ab5b-8e74aac162de";
const RASP_BASE = "https://api.rasp.yandex.net/v3.0";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

router.get("/", async (req, res) => {
  const from = req.query.from as string;
  const to = req.query.to as string;
  const date = (req.query.date as string) || formatDate(new Date());

  if (!from || !to) {
    res.status(400).json({ error: "from and to are required" });
    return;
  }

  try {
    const url = `${RASP_BASE}/search/?apikey=${YANDEX_RASP_API_KEY}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}&transport_types=suburban&format=json&lang=ru_RU&limit=100`;

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      req.log.error({ status: response.status, body: text }, "Yandex Rasp API error");
      res.status(502).json({
        date,
        from: { code: from, title: from },
        to: { code: to, title: to },
        segments: [],
        interval_segments: [],
      });
      return;
    }

    const data = await response.json() as any;

    const mapStation = (s: any) => ({
      code: s?.codes?.yandex_code || s?.code || "",
      title: s?.title || "",
      popular_title: s?.popular_title || "",
      short_title: s?.short_title || "",
      lat: s?.station_type_name ? null : s?.latitude || null,
      lng: s?.station_type_name ? null : s?.longitude || null,
      region: null,
      direction: null,
    });

    const fromStation = mapStation(data?.search?.from || {});
    fromStation.code = from;
    const toStation = mapStation(data?.search?.to || {});
    toStation.code = to;

    const mapSegment = (seg: any, idx: number) => {
      const thread = seg.thread || {};
      const prices = seg.tickets_info?.places || [];
      let priceMin: number | null = null;
      let priceMax: number | null = null;
      if (prices.length > 0) {
        const vals = prices
          .filter((p: any) => p?.price?.whole)
          .map((p: any) => p.price.whole as number);
        if (vals.length > 0) {
          priceMin = Math.min(...vals);
          priceMax = Math.max(...vals);
        }
      }

      return {
        uid: thread.uid || `seg-${idx}`,
        number: thread.number || "",
        title: thread.title || "",
        departure: seg.departure || "",
        arrival: seg.arrival || "",
        duration: seg.duration || 0,
        from_station: {
          code: seg.from?.codes?.yandex_code || from,
          title: seg.from?.title || "",
          popular_title: seg.from?.popular_title || "",
          short_title: seg.from?.short_title || "",
          lat: null,
          lng: null,
          region: null,
          direction: null,
        },
        to_station: {
          code: seg.to?.codes?.yandex_code || to,
          title: seg.to?.title || "",
          popular_title: seg.to?.popular_title || "",
          short_title: seg.to?.short_title || "",
          lat: null,
          lng: null,
          region: null,
          direction: null,
        },
        stops: seg.stops || null,
        price_min: priceMin,
        price_max: priceMax,
        ticket_type: seg.ticket_type || null,
        transport_subtype: thread?.transport_subtype?.title || null,
        thread_express_type: thread?.express_type || null,
      };
    };

    const segments = (data?.segments || []).map(mapSegment);
    const intervalSegments = (data?.interval_segments || []).map(mapSegment);

    res.json({
      date,
      from: fromStation,
      to: toStation,
      segments,
      interval_segments: intervalSegments,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching schedule");
    res.status(500).json({
      date,
      from: { code: from, title: from },
      to: { code: to, title: to },
      segments: [],
      interval_segments: [],
    });
  }
});

router.get("/thread", async (req, res) => {
  const uid = req.query.uid as string;
  const date = (req.query.date as string) || formatDate(new Date());

  if (!uid) {
    res.status(400).json({ error: "uid is required" });
    return;
  }

  try {
    const url = `${RASP_BASE}/thread/?apikey=${YANDEX_RASP_API_KEY}&uid=${encodeURIComponent(uid)}&date=${date}&format=json&lang=ru_RU&show_systems=yandex`;
    const response = await fetch(url);

    if (!response.ok) {
      res.status(502).json({ stops: [] });
      return;
    }

    const data = await response.json() as any;
    const stops = (data?.stops || []).map((s: any) => ({
      station: {
        title: s?.station?.title || "",
        short_title: s?.station?.short_title || "",
        popular_title: s?.station?.popular_title || "",
        code: s?.station?.codes?.yandex_code || s?.station?.code || "",
      },
      arrival: s?.arrival || null,
      departure: s?.departure || null,
      duration: s?.duration || null,
      stop_time: s?.stop_time || null,
    }));

    res.json({ stops, uid, date });
  } catch (err) {
    req.log.error({ err }, "Error fetching thread");
    res.status(500).json({ stops: [] });
  }
});

export default router;
