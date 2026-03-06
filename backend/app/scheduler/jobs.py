from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.cache import cache_set

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

# TTLs match redis-keys.md
_INDEX_TTL = 60
_QUOTE_TTL = 60


async def refresh_tw_index():
    """Periodically refresh TAIEX index into Redis."""
    try:
        from app.fetchers.twse import get_taiex_index_snapshot
        from app.schemas.common import MarketIndex

        q = await get_taiex_index_snapshot()
        m = MarketIndex(
            code="TAIEX",
            name="加權指數",
            ts=q.ts,
            price=q.price,
            change=q.change,
            change_pct=q.change_pct,
            currency=q.currency,
            source=q.source,
            is_delayed=q.is_delayed,
        )
        await cache_set("index:TW:TAIEX", m.model_dump(), ttl=_INDEX_TTL)
        logger.info("Refreshed TAIEX: %s", q.price)
    except Exception as e:
        logger.warning("refresh_tw_index failed: %s", e)


async def refresh_us_indices():
    """Periodically refresh US indices into Redis."""
    try:
        from app.services.market_service import _sync_us_indices
        import asyncio

        items = await asyncio.to_thread(_sync_us_indices)
        await cache_set("indices:US:major", items, ttl=_INDEX_TTL)
        logger.info("Refreshed US indices: %d items", len(items))
    except Exception as e:
        logger.warning("refresh_us_indices failed: %s", e)


def start_scheduler():
    """Call once at app startup to register and start jobs."""
    scheduler.add_job(refresh_tw_index, "interval", minutes=5, id="tw_index", replace_existing=True)
    scheduler.add_job(refresh_us_indices, "interval", minutes=5, id="us_indices", replace_existing=True)
    scheduler.start()
    logger.info("APScheduler started with 2 jobs")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
