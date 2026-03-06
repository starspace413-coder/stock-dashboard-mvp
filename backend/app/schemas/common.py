from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Market = Literal["TW", "US"]


class Stock(BaseModel):
    ticker: str = Field(examples=["TW:2330", "US:AAPL"])
    symbol: str
    name: str
    market: Market
    currency: str
    sector: str | None = None
    industry: str | None = None


class Quote(BaseModel):
    ticker: str
    ts: datetime
    price: float
    currency: str
    source: str
    is_delayed: bool

    change: float | None = None
    change_pct: float | None = None
    open: float | None = None
    high: float | None = None
    low: float | None = None
    volume: int | None = None


class Candle(BaseModel):
    time: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int | None = None


class MarketIndex(BaseModel):
    code: str
    name: str
    ts: datetime
    price: float
    currency: str
    source: str
    is_delayed: bool

    change: float | None = None
    change_pct: float | None = None
