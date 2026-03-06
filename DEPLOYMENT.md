# Deployment (Free-first)

## Target
- Frontend: Vercel
- Backend: Render (free plan, will sleep)
- Postgres: Neon (free)
- Redis: Upstash (free)

## Backend (Render)
1. Push this repo to GitHub.
2. In Render: **New + → Blueprint** → select repo.
3. Set env vars:
   - `DATABASE_URL` = Neon connection string (use asyncpg)
   - `REDIS_URL` = Upstash Redis URL

Health check:
- `/healthz`

## Frontend (Vercel)
1. Deploy `frontend/` to Vercel.
2. In Vercel Project Settings → Environment Variables, set:
   - `NEXT_PUBLIC_API_BASE_URL` = your Render backend base url (e.g. https://xxx.onrender.com)
3. Redeploy.

## Important
- Ensure `.env` is NOT committed.
- Free data sources are delayed; UI should label `is_delayed`.
