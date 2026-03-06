from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas.common import Stock

router = APIRouter(prefix="/api", tags=["stocks"])


@router.get("/stocks/search")
async def search_stocks(q: str = Query(..., min_length=1), market: str | None = None):
    # MVP: return empty list until DB is wired.
    # Next step: query Postgres (ticker/symbol/name ILIKE) + basic fuzzy.
    _ = (q, market)
    return {"items": []}
