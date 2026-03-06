from __future__ import annotations

from fastapi import FastAPI

from app.core.config import settings
from app.routers import market, stock, stocks


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)

    app.include_router(market.router)
    app.include_router(stocks.router)
    app.include_router(stock.router)

    @app.get("/healthz")
    async def healthz():
        return {"ok": True, "env": settings.env}

    return app


app = create_app()
