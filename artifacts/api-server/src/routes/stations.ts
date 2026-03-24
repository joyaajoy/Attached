import { Router, type IRouter } from "express";

const router: IRouter = Router();

const YANDEX_RASP_API_KEY = "a657f80d-9c96-4dc4-ab5b-8e74aac162de";
const RASP_BASE = "https://api.rasp.yandex.net/v3.0";

router.get("/search", async (req, res) => {
  const q = req.query.q as string;
  if (!q || q.length < 2) {
    res.json({ stations: [] });
    return;
  }

  try {
    const url = `${RASP_BASE}/search/?apikey=${YANDEX_RASP_API_KEY}&from=${encodeURIComponent(q)}&to=&format=json&lang=ru_RU&transport_types=suburban`;
    const response = await fetch(`${RASP_BASE}/stations_list/?apikey=${YANDEX_RASP_API_KEY}&lang=ru_RU&format=json`);

    if (!response.ok) {
      req.log.error({ status: response.status }, "Yandex API error on stations list");
      res.status(502).json({ stations: [] });
      return;
    }

    const data = await response.json() as any;
    const allStations: any[] = [];

    if (data?.countries) {
      for (const country of data.countries) {
        if (!country?.regions) continue;
        for (const region of country.regions) {
          if (!region?.settlements) continue;
          for (const settlement of region.settlements) {
            if (!settlement?.stations) continue;
            for (const station of settlement.stations) {
              if (station.transport_type !== "train" && station.transport_type !== "suburban") continue;
              allStations.push({
                code: station.codes?.yandex_code || station.codes?.esr_code || "",
                title: station.title || "",
                popular_title: settlement.title || "",
                short_title: station.short_title || "",
                lat: station.latitude || null,
                lng: station.longitude || null,
                region: region.title || null,
                direction: station.direction || null,
              });
            }
          }
        }
      }
    }

    const qLower = q.toLowerCase();
    const matched = allStations
      .filter(s => s.code && s.title && s.title.toLowerCase().includes(qLower))
      .slice(0, 30);

    res.json({ stations: matched });
  } catch (err) {
    req.log.error({ err }, "Error searching stations");
    res.status(500).json({ stations: [] });
  }
});

router.get("/popular", async (req, res) => {
  const popular = [
    { code: "s9600213", title: "Москва Курская", popular_title: "Москва", short_title: "Курская", lat: 55.7539, lng: 37.6586, region: "Москва", direction: null },
    { code: "s9601660", title: "Москва Ярославская", popular_title: "Москва", short_title: "Ярославская", lat: 55.7765, lng: 37.6568, region: "Москва", direction: null },
    { code: "s9602497", title: "Москва Казанская", popular_title: "Москва", short_title: "Казанская", lat: 55.7751, lng: 37.6561, region: "Москва", direction: null },
    { code: "s2000006", title: "Санкт-Петербург Главный", popular_title: "Санкт-Петербург", short_title: "Финляндский вокзал", lat: 59.9547, lng: 30.3551, region: "Санкт-Петербург", direction: null },
    { code: "s9602494", title: "Москва Павелецкая", popular_title: "Москва", short_title: "Павелецкая", lat: 55.7295, lng: 37.6449, region: "Москва", direction: null },
    { code: "s9601728", title: "Москва Белорусская", popular_title: "Москва", short_title: "Белорусская", lat: 55.7763, lng: 37.5815, region: "Москва", direction: null },
    { code: "s9600721", title: "Москва Рижская", popular_title: "Москва", short_title: "Рижская", lat: 55.7886, lng: 37.6124, region: "Москва", direction: null },
    { code: "s9601728", title: "Москва Савёловская", popular_title: "Москва", short_title: "Савёловская", lat: 55.7949, lng: 37.5887, region: "Москва", direction: null },
    { code: "s9600372", title: "Электроугли", popular_title: "Москва", short_title: "Электроугли", lat: 55.717, lng: 38.228, region: "Московская область", direction: null },
    { code: "s9603060", title: "Мытищи", popular_title: "Мытищи", short_title: "Мытищи", lat: 55.9121, lng: 37.7307, region: "Московская область", direction: null },
    { code: "s9600721", title: "Пушкино", popular_title: "Пушкино", short_title: "Пушкино", lat: 56.009, lng: 37.8458, region: "Московская область", direction: null },
    { code: "s2000006", title: "Санкт-Петербург Витебский", popular_title: "Санкт-Петербург", short_title: "Витебский", lat: 59.9191, lng: 30.3241, region: "Санкт-Петербург", direction: null },
  ];
  res.json({ stations: popular });
});

export default router;
