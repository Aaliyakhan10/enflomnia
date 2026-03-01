from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine, Base
from app.routers import reach, comments, workload, pricing, scripts, matching, instagram, intelligence, content_schedule

# Import all models so Alembic/SQLAlchemy can discover them
import app.models  # noqa: F401

settings = get_settings()

# Create tables in dev (SQLite). For production use Alembic migrations.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inflomnia — Resilience Engine API",
    description="The Shield + The Accelerator: Resilience Engine and Monetization Accelerator",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow Amplify frontend and local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten to Amplify domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(reach.router)
app.include_router(comments.router)
app.include_router(workload.router)
# Accelerator
app.include_router(pricing.router)
app.include_router(scripts.router)
app.include_router(matching.router)
# Instagram
app.include_router(instagram.router)
# Content Intelligence (Phase 2)
app.include_router(intelligence.router)
app.include_router(content_schedule.router)


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "inflomnia-resilience-engine", "version": "1.0.0"}
