from __future__ import annotations

from datetime import timezone

from app.core.cache import cache_get, cache_set
from app.fetchers.yahoo import YahooFetcher
from app.schemas.common import Candle, Quote
from app.schemas.responses import HistoryResponse, IndicatorsResponse
from app.processors.technical import compute_indicators
from app.utils.ticker import parse_ticker

# Cache TTLs (seconds)
_QUOTE_TTL = 60
_HISTORY_TTL = 3600  # 1 hour
_INDICATOR_TTL = 300  # 5 min

_fetcher = YahooFetcher()


async def get_quote(ticker: str) -> Quote:
    parse_ticker(ticker)

    key = f"quote:{ticker}"
    cached = await cache_get(key)
    if cached:
        return Quote(**cached)

    dto = await _fetcher.get_quote(ticker)
    result = Quote(
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
    await cache_set(key, result.model_dump(), ttl=_QUOTE_TTL)
    return result


async def get_history(ticker: str, interval: str, period: str) -> HistoryResponse:
    parse_ticker(ticker)

    key = f"daily:{ticker}:{period}"
    cached = await cache_get(key)
    if cached:
        return HistoryResponse(**cached)

    dtos = await _fetcher.get_history(ticker, interval=interval, period=period)
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
    result = HistoryResponse(ticker=ticker, interval=interval, candles=candles)
    await cache_set(key, result.model_dump(), ttl=_HISTORY_TTL)
    return result


async def get_indicators(ticker: str, interval: str, period: str, types: list[str]) -> IndicatorsResponse:
    types_key = ",".join(sorted(types))
    key = f"ind:{ticker}:{interval}:{period}:{types_key}"
    cached = await cache_get(key)
    if cached:
        return IndicatorsResponse(**cached)

    hist = await get_history(ticker, interval=interval, period=period)
    candle_dicts = [c.model_dump() for c in hist.candles]
    indicators = compute_indicators(candle_dicts, types=types)
    result = IndicatorsResponse(ticker=ticker, interval=interval, period=period, indicators=indicators)
    await cache_set(key, result.model_dump(), ttl=_INDICATOR_TTL)
    return result
