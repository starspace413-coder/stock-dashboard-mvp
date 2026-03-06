from __future__ import annotations

import abc
from dataclasses import dataclass
from datetime import datetime


@dataclass
class QuoteDTO:
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


@dataclass
class CandleDTO:
    time: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int | None = None


class BaseFetcher(abc.ABC):
    @abc.abstractmethod
    async def get_quote(self, ticker: str) -> QuoteDTO: ...

    @abc.abstractmethod
    async def get_history(self, ticker: str, interval: str, period: str) -> list[CandleDTO]: ...
