from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.workload import WorkloadSignalOut, HeatmapOut
from app.services.workload_signal import WorkloadSignalService

router = APIRouter(prefix="/api/v1/workload", tags=["Workload Signals"])
service = WorkloadSignalService()


@router.post("/analyze/{creator_id}", response_model=WorkloadSignalOut, summary="Generate workload signal")
def analyze_workload(creator_id: str, db: Session = Depends(get_db)):
    """
    Computes 30-day engagement heatmap, derives patterns,
    then calls Claude 3.5 to generate a posting schedule recommendation.
    """
    result = service.analyze_and_generate(db, creator_id)
    if not result:
        raise HTTPException(500, "Failed to generate signal")
    return result


@router.get("/signals/{creator_id}", response_model=Optional[WorkloadSignalOut], summary="Get latest signal")
def get_signal(creator_id: str, db: Session = Depends(get_db)):
    """Returns the most recently generated workload signal for the creator."""
    return service.get_latest_signal(db, creator_id)


@router.get("/heatmap/{creator_id}", response_model=HeatmapOut, summary="Get engagement heatmap")
def get_heatmap(creator_id: str, days: int = 30, db: Session = Depends(get_db)):
    """
    Returns a 7-day × 24-hour engagement heatmap built from the last N days
    of comment and reach data.
    """
    heatmap = service.compute_heatmap(db, creator_id, days)
    # Fill any missing days with zeros
    from app.services.workload_signal import DAYS
    for day in DAYS:
        if day not in heatmap:
            heatmap[day] = [0.0] * 24
    return heatmap
