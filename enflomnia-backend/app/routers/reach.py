from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.reach import ReachSnapshotIn, ReachSnapshotOut, AnomalyResult
from app.services.reach_anomaly import ReachAnomalyService

router = APIRouter(prefix="/api/v1/reach", tags=["Reach Anomaly"])
service = ReachAnomalyService()


@router.post("/sync/{creator_id}", response_model=AnomalyResult, summary="Auto-sync reach from Instagram data then analyze")
def sync_and_analyze(creator_id: str, db: Session = Depends(get_db)):
    """
    Derives ReachSnapshots automatically from the Reel table (no manual data entry).
    Runs anomaly detection and returns the result.
    Call this after syncing Instagram reels.
    """
    service.ingest_from_reels(db, creator_id)
    result = service.analyze(db, creator_id)
    return result


@router.post("/snapshots", response_model=ReachSnapshotOut, summary="Manually ingest a reach data point")
def ingest_snapshot(payload: ReachSnapshotIn, db: Session = Depends(get_db)):
    """Store a new reach snapshot manually. Also archives to S3."""
    snapshot = service.ingest_snapshot(db, payload.creator_id, payload.reach, payload.impressions)
    return snapshot


@router.get("/snapshots/{creator_id}", response_model=List[ReachSnapshotOut], summary="Get reach history")
def get_snapshots(creator_id: str, limit: int = 30, db: Session = Depends(get_db)):
    from app.models.reach_snapshot import ReachSnapshot
    snapshots = (
        db.query(ReachSnapshot)
        .filter(ReachSnapshot.creator_id == creator_id)
        .order_by(ReachSnapshot.recorded_at.desc())
        .limit(limit)
        .all()
    )
    return snapshots


@router.get("/analyze/{creator_id}", response_model=AnomalyResult, summary="Detect reach anomaly")
def analyze_reach(creator_id: str, db: Session = Depends(get_db)):
    """
    Analyse the creator's recent reach data.
    Detects whether a drop is creator-specific or platform-wide.
    Uses OpenSearch RAG for cross-creator comparison + Gemini for reasoning.
    """
    # Auto-derive any new reach snapshots from Reel data before analyzing
    service.ingest_from_reels(db, creator_id)
    result = service.analyze(db, creator_id)
    return result

