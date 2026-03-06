from __future__ import annotations

from fastapi import APIRouter

from app.schemas.common import MarketIndex
from app.services.market_service import get_tw_index, get_us_indices

router = APIRouter(prefix="/api", tags=["market"])


@router.get("/market/tw/index", response_model=MarketIndex)
async def tw_index():
    return await get_tw_index()


@router.get("/market/us/indices")
async def us_indices():
    items = await get_us_indices()
    return {"items": items}
