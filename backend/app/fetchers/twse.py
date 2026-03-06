from __future__ import annotations

from datetime import datetime, timezone

import httpx

from app.fetchers.base import BaseFetcher, CandleDTO, QuoteDTO
from app.utils.ticker import parse_ticker


class TwseFetcher(BaseFetcher):
    """TWSE open data (mostly EOD / delayed). MVP: index snapshot only + (optional) history later."""

    async def get_quote(self, ticker: str) -> QuoteDTO:
        pt = parse_ticker(ticker)
        if pt.market != "TW":
            raise ValueError("TwseFetcher only supports TW tickers")

        # For MVP, we don't implement per-stock quote via TWSE.
        raise NotImplementedError("TW per-stock quote is not available via TWSE in MVP")

    async def get_history(self, ticker: str, interval: str, period: str) -> list[CandleDTO]:
        pt = parse_ticker(ticker)
        if pt.market != "TW":
            raise ValueError("TwseFetcher only supports TW tickers")
        raise NotImplementedError("TW history fetch to be implemented (TWSE/FinMind) in next step")


async def get_taiex_index_snapshot() -> QuoteDTO:
    """Best-effort TAIEX snapshot using TWSE endpoints.

    TWSE has several public endpoints; they can change. We keep this function isolated.
    If it breaks, swap in FinMind or another provider.
    """

    url = "https://www.twse.com.tw/exchangeReport/MI_INDEX?response=json&type=IND"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(url)
        r.raise_for_status()
        data = r.json()

    # This endpoint format is not stable; we'll do defensive parsing.
    price = None
    change = None
    change_pct = None

    # Try common keys
    if isinstance(data, dict):
        # Sometimes data["data1"] contains strings; sometimes different.
        for key in ("data1", "data9", "data8", "data"):
            rows = data.get(key)
            if isinstance(rows, list) and rows:
                # Find a row mentioning 加權指數/發行量加權股價指數
                for row in rows:
                    if not isinstance(row, list):
                        continue
                    row_str = " ".join(map(str, row))
                    if "加權" in row_str or "發行量加權" in row_str or "TAIEX" in row_str:
                        # heuristic: last numeric-ish fields include index and change
                        nums = []
                        for cell in row:
                            s = str(cell).replace(",", "")
                            try:
                                nums.append(float(s))
                            except Exception:
                                continue
                        if nums:
                            price = nums[0]
                            if len(nums) > 1:
                                change = nums[1]
                        break
                if price is not None:
                    break

    if price is None:
        raise RuntimeError("Unable to parse TAIEX index snapshot from TWSE response")

    return QuoteDTO(
        ts=datetime.now(timezone.utc),
        price=float(price),
        currency="TWD",
        source="twse",
        is_delayed=True,
        change=float(change) if change is not None else None,
        change_pct=float(change_pct) if change_pct is not None else None,
    )
