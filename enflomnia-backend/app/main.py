from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine, Base
from app.routers import reach, comments, workload, pricing, scripts, matching, instagram, intelligence, content_schedule, orchestrator, webhooks
from app.routers import enterprise as enterprise_router

# Import all models so SQLAlchemy can discover them
import app.models  # noqa: F401

settings = get_settings()

# Create tables (Supabase PostgreSQL or local SQLite)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Enflomnia — Content Nervous System API",
    description="The Self-Evolving Content Nervous System: The Aegis, The Alchemist, The Pulse, The DNA & Soil. Powered by Supabase + Langfuse.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(reach.router)
app.include_router(comments.router)
app.include_router(workload.router)
app.include_router(pricing.router)
app.include_router(scripts.router)
app.include_router(matching.router)
app.include_router(instagram.router)
app.include_router(intelligence.router)
app.include_router(content_schedule.router)
# Unified Orchestrator
app.include_router(orchestrator.router)
# Enterprise Vault
app.include_router(enterprise_router.router)
# Nutrient Cycle Webhooks
app.include_router(webhooks.router)


@app.get("/health", tags=["Health"])
def health():
    db_type = "supabase-postgresql" if "postgresql" in settings.database_url else "sqlite-local"
    langfuse_status = "connected" if settings.langfuse_public_key else "not-configured"
    supabase_status = "connected" if settings.supabase_url else "not-configured"
    return {
        "status": "ok",
        "service": "enflomnia-nervous-system",
        "version": "2.0.0",
        "database": db_type,
        "langfuse": langfuse_status,
        "supabase": supabase_status,
    }
