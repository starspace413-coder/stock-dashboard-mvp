from __future__ import annotations

import asyncio
from datetime import datetime, timezone

import yfinance as yf

from app.core.cache import cache_get, cache_set
from app.fetchers.twse import get_taiex_index_snapshot
from app.schemas.common import MarketIndex

# Cache TTLs (seconds)
_INDEX_TTL = 60


async def get_tw_index() -> MarketIndex:
    key = "index:TW:TAIEX"
    cached = await cache_get(key)
    if cached:
        return MarketIndex(**cached)

    q = await get_taiex_index_snapshot()
    result = MarketIndex(
        code="TAIEX",
        name="加權指數",
        ts=q.ts,
        price=q.price,
        change=q.change,
        change_pct=q.change_pct,
        currency=q.currency,
        source=q.source,
        is_delayed=q.is_delayed,
    )
    await cache_set(key, result.model_dump(), ttl=_INDEX_TTL)
    return result


def _sync_us_indices() -> list[dict]:
    """Blocking yfinance calls — run via asyncio.to_thread()."""
    mapping = [
        ("^GSPC", "S&P 500", "USD"),
        ("^IXIC", "Nasdaq", "USD"),
        ("^DJI", "Dow Jones", "USD"),
    ]
    now = datetime.now(timezone.utc)
    items: list[dict] = []
    for sym, name, ccy in mapping:
        t = yf.Ticker(sym)
        info = t.fast_info
        price = info.get("last_price")
        if price is None:
            continue
        items.append(
            dict(
                code=sym,
                name=name,
                ts=now,
                price=float(price),
                currency=str(info.get("currency") or ccy),
                source="yahoo",
                is_delayed=True,
            )
        )
    return items


async def get_us_indices() -> list[MarketIndex]:
    key = "indices:US:major"
    cached = await cache_get(key)
    if cached:
        return [MarketIndex(**item) for item in cached]

    items = await asyncio.to_thread(_sync_us_indices)
    result = [MarketIndex(**item) for item in items]
    await cache_set(key, items, ttl=_INDEX_TTL)
    return result
