from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine, Base
from app.routers import reach, comments, workload

# Import all models so Alembic/SQLAlchemy can discover them
import app.models  # noqa: F401

settings = get_settings()

# Create tables in dev (SQLite). For production use Alembic migrations.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inflomnia — Resilience Engine API",
    description="The Shield: Reach Anomaly Detection, Comment Shield, and Workload Signal Engine",
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


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "inflomnia-resilience-engine", "version": "1.0.0"}
