import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean
from sqlalchemy.sql import func
from app.database import Base


class Reel(Base):
    """A fetched Instagram Reel with its engagement metrics."""
    __tablename__ = "reels"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id = Column(String, nullable=False, index=True)
    ig_media_id = Column(String, nullable=False, unique=True)
    permalink = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    caption = Column(Text, nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)

    # Basic metrics (always available)
    like_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)

    # Insights (Business/Creator accounts only)
    reach = Column(Integer, nullable=True)
    plays = Column(Integer, nullable=True)
    saved = Column(Integer, nullable=True)
    total_interactions = Column(Integer, nullable=True)
    avg_watch_time_ms = Column(Float, nullable=True)   # milliseconds
    total_watch_time_ms = Column(Float, nullable=True)

    # Claude analysis
    hook_quality_score = Column(Float, nullable=True)  # 0–10
    analysis_summary = Column(Text, nullable=True)
    best_practices = Column(Text, nullable=True)       # JSON list
    improvement_tips = Column(Text, nullable=True)     # JSON list

    # Reach Anomaly
    # none | creator_specific | platform_wide
    anomaly_type = Column(String, nullable=True)
    anomaly_confidence = Column(Float, nullable=True)
    anomaly_reasoning = Column(String, nullable=True)

    fetched_at = Column(DateTime(timezone=True), server_default=func.now())
