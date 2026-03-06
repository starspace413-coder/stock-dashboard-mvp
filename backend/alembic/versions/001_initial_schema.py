"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-03-06
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    op.create_table(
        "stocks",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("ticker", sa.String(32), unique=True, nullable=False),
        sa.Column("symbol", sa.String(20), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("market", sa.String(10), nullable=False),
        sa.Column("currency", sa.String(8), nullable=False),
        sa.Column("sector", sa.String(50), nullable=True),
        sa.Column("industry", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint("market IN ('TW','US')", name="ck_stocks_market"),
    )
    op.create_index("ix_stocks_ticker", "stocks", ["ticker"])

    op.create_table(
        "price_history",
        sa.Column("time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("stock_id", sa.Integer(), sa.ForeignKey("stocks.id"), nullable=False),
        sa.Column("interval", sa.String(8), nullable=False, server_default="1d"),
        sa.Column("open", sa.Numeric(12, 4)),
        sa.Column("high", sa.Numeric(12, 4)),
        sa.Column("low", sa.Numeric(12, 4)),
        sa.Column("close", sa.Numeric(12, 4)),
        sa.Column("volume", sa.BigInteger()),
        sa.Column("turnover", sa.BigInteger()),
        sa.PrimaryKeyConstraint("time", "stock_id", "interval"),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("display_name", sa.String(100)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "watchlist",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("stock_id", sa.Integer(), sa.ForeignKey("stocks.id"), nullable=False),
        sa.Column("added_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "stock_id", name="uq_watchlist_user_stock"),
    )


def downgrade() -> None:
    op.drop_table("watchlist")
    op.drop_table("users")
    op.drop_table("price_history")
    op.drop_index("ix_stocks_ticker", "stocks")
    op.drop_table("stocks")
