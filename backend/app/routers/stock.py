from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas.responses import HistoryResponse, IndicatorsResponse
from app.schemas.common import Quote
from app.services.stock_service import get_history, get_indicators, get_quote

router = APIRouter(prefix="/api", tags=["stock"])


@router.get("/stock/{ticker}/quote", response_model=Quote)
async def stock_quote(ticker: str):
    return await get_quote(ticker)


@router.get("/stock/{ticker}/history", response_model=HistoryResponse)
async def stock_history(
    ticker: str,
    interval: str = Query(default="1d"),
    period: str = Query(default="1y"),
):
    return await get_history(ticker, interval=interval, period=period)


@router.get("/stock/{ticker}/indicators", response_model=IndicatorsResponse)
async def stock_indicators(
    ticker: str,
    interval: str = Query(default="1d"),
    period: str = Query(default="1y"),
    types: str = Query(..., description="comma-separated: ma,rsi,macd"),
):
    types_list = [t.strip().lower() for t in types.split(",") if t.strip()]
    return await get_indicators(ticker, interval=interval, period=period, types=types_list)
