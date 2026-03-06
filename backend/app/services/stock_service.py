from __future__ import annotations

from datetime import timezone

from app.fetchers.yahoo import YahooFetcher
from app.schemas.common import Candle, Quote
from app.schemas.responses import HistoryResponse, IndicatorsResponse
from app.processors.technical import compute_indicators


yahoo = YahooFetcher()


async def get_quote(ticker: str) -> Quote:
    dto = await yahoo.get_quote(ticker)
    return Quote(
        ticker=ticker,
        ts=dto.ts.astimezone(timezone.utc),
        price=dto.price,
        change=dto.change,
        change_pct=dto.change_pct,
        open=dto.open,
        high=dto.high,
        low=dto.low,
        volume=dto.volume,
        currency=dto.currency,
        source=dto.source,
        is_delayed=dto.is_delayed,
    )


async def get_history(ticker: str, interval: str, period: str) -> HistoryResponse:
    dtos = await yahoo.get_history(ticker, interval=interval, period=period)
    candles = [
        Candle(
            time=c.time,
            open=c.open,
            high=c.high,
            low=c.low,
            close=c.close,
            volume=c.volume,
        )
        for c in dtos
    ]
    return HistoryResponse(ticker=ticker, interval=interval, candles=candles)


async def get_indicators(ticker: str, interval: str, period: str, types: list[str]) -> IndicatorsResponse:
    hist = await get_history(ticker, interval=interval, period=period)
    candle_dicts = [c.model_dump() for c in hist.candles]
    indicators = compute_indicators(candle_dicts, types=types)
    return IndicatorsResponse(ticker=ticker, interval=interval, period=period, indicators=indicators)
