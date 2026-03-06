from __future__ import annotations

from datetime import datetime

from sqlalchemy import String, Integer, CheckConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class StockModel(Base):
    __tablename__ = "stocks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    market: Mapped[str] = mapped_column(String(10), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False)
    sector: Mapped[str | None] = mapped_column(String(50), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(50), nullable=True)

    __table_args__ = (
        CheckConstraint("market IN ('TW','US')", name="ck_stocks_market"),
    )
