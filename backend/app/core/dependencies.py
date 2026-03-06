from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from redis.asyncio import Redis

from app.core.config import settings


# --- SQLAlchemy async engine ---
engine = create_async_engine(settings.database_url, echo=False, pool_pre_ping=True)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


# --- Redis (kept for DI usage in routers if needed) ---
async def get_redis() -> AsyncGenerator[Redis, None]:
    r = Redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)
    try:
        yield r
    finally:
        await r.aclose()
