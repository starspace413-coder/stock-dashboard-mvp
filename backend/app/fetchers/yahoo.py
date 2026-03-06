from __future__ import annotations

from datetime import datetime, timezone

import pandas as pd
import yfinance as yf

from app.fetchers.base import BaseFetcher, CandleDTO, QuoteDTO
from app.utils.ticker import parse_ticker


class YahooFetcher(BaseFetcher):
    """Free-ish data source.

    Notes:
    - For US equities, symbol maps directly (AAPL).
    - For TW equities, Yahoo typically uses suffix like 2330.TW, but MVP uses TWSE fetcher.
    """

    async def get_quote(self, ticker: str) -> QuoteDTO:
        pt = parse_ticker(ticker)
        if pt.market != "US":
            raise ValueError("YahooFetcher only supports US tickers in MVP")

        t = yf.Ticker(pt.symbol)
        info = t.fast_info

        price = float(info.get("last_price"))
        currency = str(info.get("currency") or "USD")

        # change fields are not always present in fast_info reliably
        return QuoteDTO(
            ts=datetime.now(timezone.utc),
            price=price,
            currency=currency,
            source="yahoo",
            is_delayed=True,
        )

    async def get_history(self, ticker: str, interval: str, period: str) -> list[CandleDTO]:
        pt = parse_ticker(ticker)
        if pt.market != "US":
            raise ValueError("YahooFetcher only supports US tickers in MVP")
        if interval != "1d":
            raise ValueError("MVP supports interval=1d only")

        t = yf.Ticker(pt.symbol)
        df: pd.DataFrame = t.history(period=period, interval=interval, auto_adjust=False)
        if df is None or df.empty:
            return []

        df = df.reset_index()
        # yfinance returns tz-aware timestamps in some cases; normalize to UTC
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
