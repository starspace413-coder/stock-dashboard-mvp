# Stock Dashboard Backend (FastAPI)

## Local run (no Docker)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Deploy (Render)
This repo includes `backend/render.yaml` (Blueprint).

Set env vars in Render:
- `DATABASE_URL` (Postgres)
- `REDIS_URL` (Redis)

Endpoints:
- `/docs` OpenAPI UI
- `/healthz` health check
