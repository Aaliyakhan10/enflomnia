from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.services.prediction_service import PredictionService

router = APIRouter(prefix="/api/v1/intelligence", tags=["Content Intelligence"])
_svc = PredictionService()


@router.get("/content-suggestions/{creator_id}", summary="Get AI-driven content formatting suggestions")
def get_content_suggestions(creator_id: str, db: Session = Depends(get_db)):
    """
    Analyzes the creator's top performing Reels and uses Claude 3.5 
    to suggest 3 new specific formats/topics to maximize engagement.
    """
    try:
        return _svc.generate_content_suggestions(db, creator_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reel-feedback/{creator_id}/{reel_id}", summary="Get coaching feedback on a specific Reel")
def get_reel_feedback(creator_id: str, reel_id: str, db: Session = Depends(get_db)):
    """
    Takes a specific Reel's metrics (watch time, interaction rates, etc.) 
    and provides customized feedback on what worked and what to try differently.
    """
    try:
        feedback = _svc.analyze_reel_feedback(db, creator_id, reel_id)
        if "error" in feedback:
            raise HTTPException(status_code=404, detail=feedback["error"])
        return feedback
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/competitors-trends/{creator_id}", summary="Identify competitors and emerging trends")
def get_competitors_and_trends(
    creator_id: str, 
    niche: Optional[str] = Query("lifestyle", description="The niche to query against"), 
    db: Session = Depends(get_db)
):
    """
    Queries similar competitor creators in the same niche and analyzes 
    their top content to identify emerging trends before they reach saturation.
    """
    try:
        return _svc.find_competitors_and_trends(db, creator_id, niche)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/growth-simulation/{creator_id}", summary="Simulate 3, 6, and 12 month growth trajectories")
def simulate_projected_growth(creator_id: str, db: Session = Depends(get_db)):
    """
    Analyzes the creator's Reel trajectory and uses Claude 3.5 to project 
    3, 6, and 12-month follower/reach trajectories, offering strategic pivot recommendations.
    """
    try:
        return _svc.simulate_growth(db, creator_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
