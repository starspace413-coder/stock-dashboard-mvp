from __future__ import annotations

import json
from typing import Any

from redis.asyncio import Redis

from app.core.config import settings

_redis: Redis | None = None


async def get_redis() -> Redis:
    global _redis
    if _redis is None:
        _redis = Redis.from_url(
            settings.redis_url, encoding="utf-8", decode_responses=True
        )
    return _redis


async def cache_get(key: str) -> Any | None:
    """Get a JSON value from cache. Returns None on miss or error."""
    try:
        r = await get_redis()
        raw = await r.get(key)
        if raw is not None:
            return json.loads(raw)
    except Exception:
        pass
    return None


async def cache_set(key: str, value: Any, ttl: int = 60) -> None:
    """Set a JSON value in cache with TTL in seconds. Silently ignores errors."""
    try:
        r = await get_redis()
        await r.setex(key, ttl, json.dumps(value, default=str))
    except Exception:
        pass
