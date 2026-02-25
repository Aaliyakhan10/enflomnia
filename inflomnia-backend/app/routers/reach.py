from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.reach import ReachSnapshotIn, ReachSnapshotOut, AnomalyResult
from app.services.reach_anomaly import ReachAnomalyService

router = APIRouter(prefix="/api/v1/reach", tags=["Reach Anomaly"])
service = ReachAnomalyService()


@router.post("/snapshots", response_model=ReachSnapshotOut, summary="Ingest a reach data point")
def ingest_snapshot(payload: ReachSnapshotIn, db: Session = Depends(get_db)):
    """Store a new reach snapshot. Also archives to S3."""
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
    Uses OpenSearch RAG for cross-creator comparison + Claude 3.5 for reasoning.
    """
    result = service.analyze(db, creator_id)
    return result
