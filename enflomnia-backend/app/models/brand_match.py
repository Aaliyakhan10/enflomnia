import uuid
from sqlalchemy import Column, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class BrandMatch(Base):
    """A scored creator–brand match."""
    __tablename__ = "brand_matches"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id = Column(String, nullable=False, index=True)
    brand_id = Column(String, nullable=False)
    relevance_score = Column(Float, nullable=False)    # 0.0–1.0
    fit_reasoning = Column(Text, nullable=True)        # Claude explanation
    audience_overlap = Column(Float, nullable=True)    # 0.0–1.0
    niche_match = Column(Float, nullable=True)         # 0.0–1.0
    status = Column(String, default="pending")         # pending | accepted | rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())
