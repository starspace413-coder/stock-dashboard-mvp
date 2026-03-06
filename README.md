# Stock Dashboard (MVP)

Free-first, deployable MVP for a TW + US stock dashboard.

- Frontend: Next.js (UI/SSR) → `frontend/`
- Backend: FastAPI (single BFF + API) → `backend/`
- DB: Postgres (Neon/Supabase) + optional Timescale later
- Cache: Redis (Upstash)

## 1-click deploy (recommended)
- Backend (Render Blueprint): https://render.com/deploy?repo=https://github.com/starspace413-coder/stock-dashboard-mvp
- Frontend (Vercel): https://vercel.com/new/import?s=https://github.com/starspace413-coder/stock-dashboard-mvp&project-name=stock-dashboard-mvp&root-directory=frontend

> 部署前請先看 `DEPLOYMENT.md`：你需要先建立 Neon(Postgres) + Upstash(Redis)，並在 Render/Vercel 設定環境變數。

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
