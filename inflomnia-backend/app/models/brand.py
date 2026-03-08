import uuid
from sqlalchemy import Column, String, Float, DateTime, Integer
from sqlalchemy.sql import func
from app.database import Base


class Brand(Base):
    """A brand available for creator partnerships."""
    __tablename__ = "brands"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    industry = Column(String, nullable=False)  # e.g. "fashion", "tech", "food"
    website = Column(String, nullable=True)
    target_audience = Column(String, nullable=True)   # e.g. "18-24 female, fitness"
    content_niches = Column(String, nullable=True)    # comma-separated match niches
    budget_range_min = Column(Float, nullable=True)
    budget_range_max = Column(Float, nullable=True)
    is_ai_discovered = Column(String, default="false") # Store as string for SQLite compatibility in this setup or Boolean
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BrandDeal(Base):
    """A pricing estimate for a creator × brand deal."""
    __tablename__ = "brand_deals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id = Column(String, nullable=False, index=True)
    brand_id = Column(String, nullable=True)           # optional — can be unnamed brand
    brand_name = Column(String, nullable=True)
    platform = Column(String, nullable=False)          # instagram | youtube | tiktok
    deliverable_type = Column(String, nullable=False)  # post | reel | video | story
    follower_count = Column(Integer, nullable=False)
    engagement_rate = Column(Float, nullable=False)
    niche = Column(String, nullable=False)
    offered_price = Column(Float, nullable=True)       # brand's offer (if known)
    suggested_price_min = Column(Float, nullable=False)
    suggested_price_max = Column(Float, nullable=False)
    recommended_price = Column(Float, nullable=False)
    reasoning = Column(String, nullable=True)
    confidence = Column(Float, default=0.7)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
