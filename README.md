# Stock Dashboard (MVP)

Free-first, deployable MVP for a TW + US stock dashboard.

- Frontend: Next.js (UI/SSR) **(to be added under `frontend/`)**
- Backend: FastAPI (`backend/`)
- DB: Postgres (Neon/Supabase) + optional Timescale later
- Cache: Redis (Upstash)

## Canonical ticker
Use `{market}:{symbol}`:
- `TW:2330`
- `US:AAPL`

## Specs
- `spec/openapi.yaml`
- `spec/schema.sql`
- `spec/redis-keys.md`

## Deploy
See `DEPLOYMENT.md` (Vercel + Render + Neon + Upstash).
