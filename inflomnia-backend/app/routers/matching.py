from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.matching import BrandIn, BrandOut, MatchOut, MatchRequestIn
from app.services.matching_service import MatchingService
from app.models.reel import Reel
from app.models.instagram_account import InstagramAccount

router = APIRouter(prefix="/api/v1/matching", tags=["Matching"])
_svc = MatchingService()


@router.post("/brands", response_model=BrandOut, summary="Add a brand to the catalogue")
def add_brand(payload: BrandIn, db: Session = Depends(get_db)):
    try:
        return _svc.add_brand(db, **payload.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/brands", response_model=List[BrandOut], summary="List all brands")
def list_brands(db: Session = Depends(get_db)):
    return _svc.get_brands(db)


@router.post("/find-brands", summary="Find best-fit brands for a creator")
def find_brands(payload: MatchRequestIn, db: Session = Depends(get_db)):
    try:
        follower_count = payload.follower_count
        engagement_rate = payload.engagement_rate
        niche = payload.niche

        # Check for specific reel override
        if payload.reel_id:
            reel = db.query(Reel).filter(Reel.id == payload.reel_id, Reel.creator_id == payload.creator_id).first()
            if reel and reel.reach and reel.reach > 0:
                engagement_rate = (reel.total_interactions or 0) / reel.reach

        if follower_count is None or engagement_rate is None or niche is None:
            account = db.query(InstagramAccount).filter(InstagramAccount.creator_id == payload.creator_id).first()
            if account:
                follower_count = follower_count or account.followers_count or 0
                
                # Calculate real ER from reels
                reels = db.query(Reel).filter(Reel.creator_id == payload.creator_id).all()
                total_reach = sum(r.reach or 0 for r in reels)
                total_interactions = sum(r.total_interactions or 0 for r in reels)
                calc_er = total_interactions / total_reach if total_reach > 0 else 0
                
                engagement_rate = engagement_rate or calc_er
                niche = niche or "general"
            else:
                follower_count = follower_count or 0
                engagement_rate = engagement_rate or 0.0
                niche = niche or "general"

        return _svc.find_matches(
            db=db,
            creator_id=payload.creator_id,
            niche=niche,
            platform=payload.platform,
            follower_count=follower_count,
            engagement_rate=engagement_rate,
            audience_description=payload.audience_description,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/matches/{creator_id}", summary="Get saved brand matches for a creator")
def get_matches(creator_id: str, db: Session = Depends(get_db)):
    return _svc.get_matches(db, creator_id)
