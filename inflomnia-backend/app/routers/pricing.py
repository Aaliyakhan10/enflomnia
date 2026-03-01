from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.pricing import PricingRequestIn, PricingResultOut, PricingHistoryOut
from app.services.pricing_service import PricingService
from app.services.mock_data_service import get_mock_creator_metrics
from app.models.reel import Reel

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

        if follower_count is None or engagement_rate is None:
            metrics = get_mock_creator_metrics(db, payload.creator_id)
            follower_count = follower_count or metrics["follower_count"]
            engagement_rate = engagement_rate or metrics["engagement_rate"]
            niche = niche or metrics["niche"]

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
