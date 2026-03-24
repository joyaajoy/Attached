# Электрички России

## Overview

A Russian electric train (elektrichka) scheduling mobile app using Expo React Native with real-time data from Yandex.Rasp API.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (tickets persistence)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo React Native with Expo Router
- **Maps**: react-native-maps (native only)
- **External API**: Yandex.Raspisaniya (rasp.yandex.net/v3.0)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── mobile/             # Expo mobile app
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
└── pnpm-workspace.yaml
```

## Mobile App Features

4 tabs:
1. **Расписание** - Search train schedules between Russian stations, real-time data from Yandex.Rasp
2. **Мои билеты** - Saved tickets stored in PostgreSQL
3. **Карта** - Station map (native) / station list (web)
4. **Профиль** - App information and stats

## API Endpoints

- `GET /api/stations/popular` — popular stations
- `GET /api/stations/search?q=...` — search stations (all Russia)
- `GET /api/schedule?from=CODE&to=CODE&date=YYYY-MM-DD` — real-time schedule from Yandex.Rasp
- `GET /api/tickets` — user saved tickets
- `POST /api/tickets` — save a ticket
- `DELETE /api/tickets/:id` — delete a ticket

## Yandex.Rasp Integration

- **API Key**: `a657f80d-9c96-4dc4-ab5b-8e74aac162de`
- Real-time suburban train (электричка) schedules
- Covers all of Russia

## DB Schema

- `tickets` table: id, segment_json, travel_date, saved_at, status
