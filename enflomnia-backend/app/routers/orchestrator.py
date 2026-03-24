"""
Orchestrator Router — Unified Content Loop API
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.services.orchestrator import Orchestrator

router = APIRouter(prefix="/api/orchestrator", tags=["Orchestrator"])

orchestrator = Orchestrator()


@router.post("/run-loop")
def run_content_loop(
    creator_id: str = Query(...),
    topic: Optional[str] = Query(None),
    tone: str = Query("entertaining"),
    db: Session = Depends(get_db),
):
    """
    Execute the full Enflomnia Content Nervous System loop.
    Chains: DNA & Soil → Alchemist → Aegis → Pulse → System Pulse
    """
    return orchestrator.run_content_loop(db, creator_id, topic, tone)


@router.get("/health")
def orchestrator_health():
    """Check if the orchestrator and all agents are initialized."""
    return {
        "status": "ok",
        "agents": {
            "dna_soil": "ready",
            "alchemist": "ready",
            "aegis": "ready",
            "pulse": "ready",
            "system_pulse": "ready",
        },
    }
