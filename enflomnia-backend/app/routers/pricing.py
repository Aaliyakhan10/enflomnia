from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.pricing import PricingRequestIn, PricingResultOut, PricingHistoryOut
from app.services.pricing_service import PricingService
from app.models.reel import Reel
from app.models.instagram_account import InstagramAccount

router = APIRouter(prefix="/api/v1/pricing", tags=["Pricing"])
_svc = PricingService()


@router.post("/estimate", response_model=PricingResultOut, summary="Estimate brand deal price range")
def estimate_price(payload: PricingRequestIn, db: Session = Depends(get_db)):
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
                # No 'niche' on instagram account model yet, but matching/pricing needs one.
                # Assuming UI provides it or fallback to 'general'
                niche = niche or "general"
            else:
                follower_count = follower_count or 0
                engagement_rate = engagement_rate or 0.0
                niche = niche or "general"

        return _svc.estimate_price(
            db=db,
            creator_id=payload.creator_id,
            platform=payload.platform,
            deliverable_type=payload.deliverable_type,
            follower_count=follower_count,
            engagement_rate=engagement_rate,
            niche=niche,
            brand_name=payload.brand_name,
            brand_industry=payload.brand_industry,
            offered_price=payload.offered_price,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{creator_id}", response_model=PricingHistoryOut, summary="Get past pricing estimates")
def get_history(creator_id: str, limit: int = 20, db: Session = Depends(get_db)):
    return _svc.get_history(db, creator_id, limit)
