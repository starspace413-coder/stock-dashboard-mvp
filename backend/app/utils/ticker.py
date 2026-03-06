from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ParsedTicker:
    market: str
    symbol: str


def parse_ticker(ticker: str) -> ParsedTicker:
    # Canonical: {market}:{symbol}
    if ":" not in ticker:
        raise ValueError("ticker must be in '{market}:{symbol}' format")
    market, symbol = ticker.split(":", 1)
    market = market.upper()
    if market not in {"TW", "US"}:
        raise ValueError("market must be TW or US")
    symbol = symbol.upper()
    if not symbol:
        raise ValueError("symbol is required")
    return ParsedTicker(market=market, symbol=symbol)
