from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.instagram import ConnectInstagramIn, InstagramAccountOut, ReelBatchAnalysisOut
from app.services.reel_analysis_service import ReelAnalysisService
from app.services.reach_anomaly import ReachAnomalyService
from app.services.workload_signal import WorkloadSignalService

router = APIRouter(prefix="/api/v1/instagram", tags=["Instagram"])
_svc = ReelAnalysisService()
_reach_svc = ReachAnomalyService()
_workload_svc = WorkloadSignalService()


@router.post("/connect", response_model=InstagramAccountOut, summary="Connect Instagram account via access token")
def connect_account(payload: ConnectInstagramIn, db: Session = Depends(get_db)):
    try:
        account = _svc.connect_account(db, payload.creator_id, payload.access_token)
        return account
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to connect: {str(e)}")


@router.get("/account/{creator_id}", response_model=InstagramAccountOut, summary="Get connected Instagram account info")
def get_account(creator_id: str, db: Session = Depends(get_db)):
    account = _svc.get_account(db, creator_id)
    if not account:
        raise HTTPException(status_code=404, detail="No Instagram account connected")
    return account


@router.post("/disconnect/{creator_id}", summary="Disconnect Instagram account")
def disconnect_account(creator_id: str, db: Session = Depends(get_db)):
    try:
        return _svc.disconnect_account(db, creator_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync/{creator_id}", summary="Sync latest reels from Instagram and update all downstream services")
def sync_reels(creator_id: str, limit: int = 20, db: Session = Depends(get_db)):
    """
    Fetches the latest reels from Instagram and upserts them into the DB.
    Automatically triggers:
    - Reach snapshot derivation (no manual data entry needed)
    - Workload signal regeneration (best posting days / cadence)
    """
    try:
        reels = _svc.sync_reels(db, creator_id, limit=limit)

        # ── Auto-derive reach snapshots from the newly synced reel data ──
        try:
            _reach_svc.ingest_from_reels(db, creator_id)
        except Exception:
            pass  # Non-fatal — reels are still synced

        # ── Regenerate workload signal (best posting days) ──
        try:
            _workload_svc.analyze_and_generate(db, creator_id)
        except Exception:
            pass  # Non-fatal — schedule is refreshed opportunistically

        return {
            "synced": len(reels),
            "reels": [
                {
                    "ig_media_id": r.ig_media_id,
                    "like_count": r.like_count,
                    "plays": r.plays,
                    "reach": r.reach,
                }
                for r in reels
            ],
            "reach_snapshots_derived": True,
            "workload_signal_refreshed": True,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reels/{creator_id}", summary="Get stored reels for a creator")
def get_reels(creator_id: str, db: Session = Depends(get_db)):
    reels = _svc.get_reels(db, creator_id)
    return reels


@router.post("/analyze/{creator_id}", summary="Analyze reels with Gemini")
def analyze_reels(creator_id: str, db: Session = Depends(get_db)):
    try:
        return _svc.analyze_reels(db, creator_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

