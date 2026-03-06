from collections.abc import AsyncGenerator

from redis.asyncio import Redis

from app.core.config import settings


async def get_redis() -> AsyncGenerator[Redis, None]:
    r = Redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)
    try:
        yield r
    finally:
        await r.aclose()
