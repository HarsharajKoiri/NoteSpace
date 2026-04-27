from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.notes import router as notes_router
from app.api.routes.search import router as search_router
from app.api.routes.tasks import router as tasks_router
from app.core.config import settings
from app.db.mongo import mongo_lifespan


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="REST API for SECOND BRAIN note capture and organization.",
        lifespan=mongo_lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(notes_router, prefix=settings.api_v1_prefix)
    app.include_router(search_router, prefix=settings.api_v1_prefix)
    app.include_router(tasks_router, prefix=settings.api_v1_prefix)

    return app


app = create_application()
