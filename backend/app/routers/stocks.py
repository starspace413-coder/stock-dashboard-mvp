from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.models.stock import StockModel
from app.schemas.common import Stock

router = APIRouter(prefix="/api", tags=["stocks"])


@router.get("/stocks/search")
async def search_stocks(
    q: str = Query(..., min_length=1),
    market: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Search stocks by ticker/symbol/name (ILIKE fuzzy)."""
    pattern = f"%{q.strip()}%"

    stmt = select(StockModel).where(
        or_(
            StockModel.ticker.ilike(pattern),
            StockModel.symbol.ilike(pattern),
            StockModel.name.ilike(pattern),
        )
    )
    if market:
        stmt = stmt.where(StockModel.market == market.upper())

    stmt = stmt.limit(20)
    result = await db.execute(stmt)
    rows = result.scalars().all()

    items = [
        Stock(
            ticker=row.ticker,
            symbol=row.symbol,
            name=row.name,
            market=row.market,
            currency=row.currency,
            sector=row.sector,
            industry=row.industry,
        )
        for row in rows
    ]
    return {"items": items}
