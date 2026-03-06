"""Seed the stocks table with popular TW + US tickers.

Usage:
    cd backend
    python -m app.scripts.seed_stocks
"""
from __future__ import annotations

import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings

# Minimal seed: popular stocks for search to work
STOCKS = [
    # TW
    ("TW:2330", "2330", "台積電", "TW", "TWD", "半導體", "半導體製造"),
    ("TW:2317", "2317", "鴻海", "TW", "TWD", "電子", "電子代工"),
    ("TW:2454", "2454", "聯發科", "TW", "TWD", "半導體", "IC 設計"),
    ("TW:2308", "2308", "台達電", "TW", "TWD", "電子", "電源供應器"),
    ("TW:2382", "2382", "廣達", "TW", "TWD", "電子", "筆電代工"),
    ("TW:2881", "2881", "富邦金", "TW", "TWD", "金融", "金控"),
    ("TW:2882", "2882", "國泰金", "TW", "TWD", "金融", "金控"),
    ("TW:2891", "2891", "中信金", "TW", "TWD", "金融", "金控"),
    ("TW:2886", "2886", "兆豐金", "TW", "TWD", "金融", "金控"),
    ("TW:2303", "2303", "聯電", "TW", "TWD", "半導體", "半導體製造"),
    ("TW:3711", "3711", "日月光投控", "TW", "TWD", "半導體", "封裝測試"),
    ("TW:2412", "2412", "中華電", "TW", "TWD", "通訊", "電信"),
    ("TW:1301", "1301", "台塑", "TW", "TWD", "塑化", "石化"),
    ("TW:2002", "2002", "中鋼", "TW", "TWD", "鋼鐵", "鋼鐵"),
    ("TW:0050", "0050", "元大台灣50", "TW", "TWD", "ETF", "ETF"),
    ("TW:00878", "00878", "國泰永續高股息", "TW", "TWD", "ETF", "ETF"),
    ("TW:00940", "00940", "元大台灣價值高息", "TW", "TWD", "ETF", "ETF"),
    # US
    ("US:AAPL", "AAPL", "Apple Inc.", "US", "USD", "Technology", "Consumer Electronics"),
    ("US:MSFT", "MSFT", "Microsoft Corp.", "US", "USD", "Technology", "Software"),
    ("US:GOOGL", "GOOGL", "Alphabet Inc.", "US", "USD", "Technology", "Internet"),
    ("US:AMZN", "AMZN", "Amazon.com Inc.", "US", "USD", "Consumer Cyclical", "E-Commerce"),
    ("US:NVDA", "NVDA", "NVIDIA Corp.", "US", "USD", "Technology", "Semiconductors"),
    ("US:TSLA", "TSLA", "Tesla Inc.", "US", "USD", "Consumer Cyclical", "Auto Manufacturers"),
    ("US:META", "META", "Meta Platforms Inc.", "US", "USD", "Technology", "Internet"),
    ("US:TSM", "TSM", "Taiwan Semiconductor ADR", "US", "USD", "Technology", "Semiconductors"),
    ("US:AMD", "AMD", "Advanced Micro Devices", "US", "USD", "Technology", "Semiconductors"),
    ("US:NFLX", "NFLX", "Netflix Inc.", "US", "USD", "Communication", "Entertainment"),
    ("US:SPY", "SPY", "SPDR S&P 500 ETF", "US", "USD", "ETF", "ETF"),
    ("US:QQQ", "QQQ", "Invesco QQQ Trust", "US", "USD", "ETF", "ETF"),
]


async def main():
    engine = create_async_engine(settings.database_url, echo=True)
    async with engine.begin() as conn:
        for ticker, symbol, name, market, currency, sector, industry in STOCKS:
            await conn.execute(
                text(
                    """
                    INSERT INTO stocks (ticker, symbol, name, market, currency, sector, industry)
                    VALUES (:ticker, :symbol, :name, :market, :currency, :sector, :industry)
                    ON CONFLICT (ticker) DO NOTHING
                    """
                ),
                dict(
                    ticker=ticker,
                    symbol=symbol,
                    name=name,
                    market=market,
                    currency=currency,
                    sector=sector,
                    industry=industry,
                ),
            )
    await engine.dispose()
    print(f"Seeded {len(STOCKS)} stocks.")


if __name__ == "__main__":
    asyncio.run(main())
