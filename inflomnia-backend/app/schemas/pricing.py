from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PricingRequestIn(BaseModel):
    creator_id: str
    reel_id: Optional[str] = None
    platform: Optional[str] = "instagram"
    deliverable_type: str            # post | reel | video | story
    follower_count: Optional[int] = None
    engagement_rate: Optional[float] = None
    niche: Optional[str] = "general"
    brand_name: Optional[str] = None
    brand_industry: Optional[str] = None
    offered_price: Optional[float] = None  # brand's offer to evaluate


class PricingResultOut(BaseModel):
    creator_id: str
    platform: str
    deliverable_type: str
    suggested_price_min: float
    suggested_price_max: float
    recommended_price: float
    offered_price: Optional[float] = None
    deal_verdict: Optional[str] = None  # "fair" | "low" | "good" | "great"
    reasoning: str
    confidence: float
    created_at: datetime

    class Config:
        from_attributes = True


class PricingHistoryOut(BaseModel):
    items: list[PricingResultOut]
    total: int
