from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from functools import partial

import pandas as pd
import yfinance as yf

from app.fetchers.base import BaseFetcher, CandleDTO, QuoteDTO
from app.utils.ticker import parse_ticker


def _yf_to_yahoo_symbol(market: str, symbol: str) -> str:
    """Convert canonical ticker parts to yfinance symbol."""
    if market == "TW":
        return f"{symbol}.TW"
    return symbol  # US symbols map directly


def _sync_get_quote(yahoo_sym: str, currency_hint: str) -> QuoteDTO:
    """Blocking yfinance call — run via asyncio.to_thread()."""
    t = yf.Ticker(yahoo_sym)
    info = t.fast_info
    price = float(info.get("last_price"))
    prev_close = info.get("previous_close")
    change = None
    change_pct = None
    if prev_close:
        prev_close = float(prev_close)
        change = round(price - prev_close, 4)
        change_pct = round(change / prev_close * 100, 2) if prev_close else None

    return QuoteDTO(
        ts=datetime.now(timezone.utc),
        price=price,
        currency=str(info.get("currency") or currency_hint),
        source="yahoo",
        is_delayed=True,
        change=change,
        change_pct=change_pct,
        open=float(info.get("open")) if info.get("open") else None,
        high=float(info.get("day_high")) if info.get("day_high") else None,
        low=float(info.get("day_low")) if info.get("day_low") else None,
        volume=int(info.get("last_volume")) if info.get("last_volume") else None,
    )


def _sync_get_history(yahoo_sym: str, interval: str, period: str) -> list[CandleDTO]:
    """Blocking yfinance call — run via asyncio.to_thread()."""
    t = yf.Ticker(yahoo_sym)
    df: pd.DataFrame = t.history(period=period, interval=interval, auto_adjust=False)
    if df is None or df.empty:
        return []

    df = df.reset_index()
    candles: list[CandleDTO] = []
    for _, row in df.iterrows():
        ts = row["Date"]
        if hasattr(ts, "to_pydatetime"):
            ts = ts.to_pydatetime()
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        else:
            ts = ts.astimezone(timezone.utc)

        candles.append(
            CandleDTO(
                time=ts,
                open=float(row["Open"]),
                high=float(row["High"]),
                low=float(row["Low"]),
                close=float(row["Close"]),
                volume=int(row["Volume"]) if not pd.isna(row.get("Volume")) else None,
            )
        )
    return candles


class YahooFetcher(BaseFetcher):
    """Unified Yahoo fetcher for both TW and US stocks.

    All blocking yfinance calls are wrapped with asyncio.to_thread()
    to avoid blocking the event loop.
    """

    async def get_quote(self, ticker: str) -> QuoteDTO:
        pt = parse_ticker(ticker)
        yahoo_sym = _yf_to_yahoo_symbol(pt.market, pt.symbol)
        currency_hint = "TWD" if pt.market == "TW" else "USD"
        return await asyncio.to_thread(_sync_get_quote, yahoo_sym, currency_hint)

    async def get_history(self, ticker: str, interval: str, period: str) -> list[CandleDTO]:
        pt = parse_ticker(ticker)
        if interval != "1d":
            raise ValueError("MVP supports interval=1d only")
        yahoo_sym = _yf_to_yahoo_symbol(pt.market, pt.symbol)
        return await asyncio.to_thread(_sync_get_history, yahoo_sym, interval, period)
