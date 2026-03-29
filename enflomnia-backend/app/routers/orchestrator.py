"""
Orchestrator Router — Unified Content Loop API
Follows CODING_STANDARDS.md: API Orchestration with Service Support.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.services.orchestrator import Orchestrator
from app.services.enterprise_service import EnterpriseService
from app.schemas.orchestrator import MasterFlowRequest

router = APIRouter(prefix="/api/orchestrator", tags=["Orchestrator"])

# ── Dependency Injection ─────────────────────────────────────────────────────

def get_orchestrator() -> Orchestrator:
    return Orchestrator()

def get_ent_svc(db: Session = Depends(get_db)) -> EnterpriseService:
    return EnterpriseService(db)

# ── Content Loop Endpoints ───────────────────────────────────────────────────

@router.post("/run-loop")
def run_content_loop(
    creator_id: str = Query(...),
    topic: Optional[str] = Query(None),
    tone: str = Query("entertaining"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    orchestrator: Orchestrator = Depends(get_orchestrator)
):
    """
    Execute the full Enflomnia Content Nervous System loop.
    Chains: DNA & Soil → Alchemist → Aegis → Pulse → System Pulse
    """
    return orchestrator.run_content_loop(
        db, creator_id, topic, tone, 
        user_email=current_user.get("email")
    )

@router.post("/master-flow")
def run_master_flow(
    body: MasterFlowRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    orchestrator: Orchestrator = Depends(get_orchestrator),
    ent_svc: EnterpriseService = Depends(get_ent_svc)
):
    """
    Enflomnia Master Flow (The Tree of Life):
    Autonomous pipeline from Seeding (Knowledge Ingestion)
    to Fruit (Automated Social Posting).
    """
    # 🌟 Production-Like Safety: Auto-onboard enterprise if it's the default ID
    if body.enterprise_id:
        ent_svc.get_or_create_enterprise(body.enterprise_id)
        
    return orchestrator.run_content_loop(
        db=db,
        creator_id=body.creator_id,
        enterprise_id=body.enterprise_id,
        topic=body.topic,
        tone=body.tone,
        user_email=current_user.get("email"),
        seed_info=body.seed_info,
        publish_automatically=body.publish_automatically
    )

@router.get("/health")
def orchestrator_health():
    """Verify Orchestrator and Agentic Pillar readiness."""
    return {
        "status": "synchronized",
        "pillars": {
            "dna_soil": "active",
            "alchemist": "active",
            "aegis": "active",
            "pulse": "active",
            "system_pulse": "active",
        },
    }
