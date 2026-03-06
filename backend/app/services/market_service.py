from __future__ import annotations

from app.fetchers.twse import get_taiex_index_snapshot
from app.schemas.common import MarketIndex


async def get_tw_index() -> MarketIndex:
    q = await get_taiex_index_snapshot()
    return MarketIndex(
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


async def get_us_indices() -> list[MarketIndex]:
    # MVP: Yahoo Finance indices (delayed)
    # Symbols: S&P500=^GSPC, Nasdaq=^IXIC, Dow=^DJI
    import yfinance as yf
    from datetime import datetime, timezone

    items: list[MarketIndex] = []
    mapping = [
        ("^GSPC", "S&P 500", "USD"),
        ("^IXIC", "Nasdaq", "USD"),
        ("^DJI", "Dow Jones", "USD"),
    ]

    now = datetime.now(timezone.utc)
    for sym, name, ccy in mapping:
        t = yf.Ticker(sym)
        info = t.fast_info
        price = info.get("last_price")
        if price is None:
            continue
        items.append(
            MarketIndex(
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
