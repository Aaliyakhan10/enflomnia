from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class BrandIn(BaseModel):
    name: str
    industry: str                       # fashion | tech | food | fitness | gaming | travel | beauty
    target_audience: Optional[str] = None   # e.g. "18-30 female fitness enthusiasts"
    content_niches: Optional[str] = None    # comma-separated: "fitness,wellness,lifestyle"
    budget_range_min: Optional[float] = None
    budget_range_max: Optional[float] = None
    website: Optional[str] = None


class BrandOut(BaseModel):
    id: str
    name: str
    industry: str
    target_audience: Optional[str]
    content_niches: Optional[str]
    budget_range_min: Optional[float]
    budget_range_max: Optional[float]

    class Config:
        from_attributes = True


class MatchOut(BaseModel):
    id: str
    brand_id: str
    brand_name: str
    brand_industry: str
    relevance_score: float
    audience_overlap: Optional[float]
    niche_match: Optional[float]
    fit_reasoning: str
    budget_range_min: Optional[float]
    budget_range_max: Optional[float]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class MatchRequestIn(BaseModel):
    creator_id: str
    reel_id: Optional[str] = None
    niche: Optional[str] = "general"
    platform: Optional[str] = "instagram"
    follower_count: Optional[int] = None
    engagement_rate: Optional[float] = None
    audience_description: Optional[str] = None  # e.g. "25-34 male gaming enthusiasts"
