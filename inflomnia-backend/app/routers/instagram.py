from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.instagram import ConnectInstagramIn, InstagramAccountOut, ReelBatchAnalysisOut
from app.services.reel_analysis_service import ReelAnalysisService

router = APIRouter(prefix="/api/v1/instagram", tags=["Instagram"])
_svc = ReelAnalysisService()


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


@router.post("/sync/{creator_id}", summary="Sync latest reels from Instagram")
def sync_reels(creator_id: str, limit: int = 20, db: Session = Depends(get_db)):
    try:
        reels = _svc.sync_reels(db, creator_id, limit=limit)
        return {"synced": len(reels), "reels": [{"ig_media_id": r.ig_media_id, "like_count": r.like_count, "plays": r.plays} for r in reels]}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reels/{creator_id}", summary="Get stored reels for a creator")
def get_reels(creator_id: str, db: Session = Depends(get_db)):
    reels = _svc.get_reels(db, creator_id)
    return reels


@router.post("/analyze/{creator_id}", summary="Analyze reels with Claude 3.5")
def analyze_reels(creator_id: str, db: Session = Depends(get_db)):
    try:
        return _svc.analyze_reels(db, creator_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
