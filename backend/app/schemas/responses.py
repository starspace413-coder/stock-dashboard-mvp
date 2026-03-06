from __future__ import annotations

from pydantic import BaseModel

from app.schemas.common import Candle


class HistoryResponse(BaseModel):
    ticker: str
    interval: str
    candles: list[Candle]


class IndicatorsResponse(BaseModel):
    ticker: str
    interval: str
    period: str
    indicators: dict
