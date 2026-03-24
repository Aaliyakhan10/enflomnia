import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class ReachSnapshot(Base):
    __tablename__ = "reach_snapshots"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id = Column(String, ForeignKey("creators.id"), nullable=False)
    reach = Column(Integer, nullable=False)
    impressions = Column(Integer, nullable=False, default=0)
    # none | creator_specific | platform_wide
    anomaly_type = Column(String, nullable=True)
    anomaly_confidence = Column(Float, nullable=True)
    anomaly_reasoning = Column(String, nullable=True)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())
