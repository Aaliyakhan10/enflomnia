from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine, Base
from app.routers import reach, comments, workload, pricing, scripts, matching, instagram, intelligence, content_schedule, orchestrator, webhooks
from app.routers import enterprise as enterprise_router
from app.dependencies import get_current_user

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

from fastapi import Request
from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("🔥 GLOBAL EXCEPTION:", traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"message": str(exc), "traceback": traceback.format_exc()}
    )

# Mount routers
# Protected Routers (Require Supabase Login)
app.include_router(reach.router, dependencies=[Depends(get_current_user)])
app.include_router(comments.router, dependencies=[Depends(get_current_user)])
app.include_router(workload.router, dependencies=[Depends(get_current_user)])
app.include_router(pricing.router, dependencies=[Depends(get_current_user)])
app.include_router(scripts.router, dependencies=[Depends(get_current_user)])
app.include_router(matching.router, dependencies=[Depends(get_current_user)])
app.include_router(instagram.router, dependencies=[Depends(get_current_user)])
app.include_router(intelligence.router, dependencies=[Depends(get_current_user)])
app.include_router(content_schedule.router, dependencies=[Depends(get_current_user)])

# Unified Orchestrator (Protected)
app.include_router(orchestrator.router, dependencies=[Depends(get_current_user)])

# Enterprise Vault (Protected)
app.include_router(enterprise_router.router, dependencies=[Depends(get_current_user)])
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
