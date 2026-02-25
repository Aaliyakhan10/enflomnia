import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class WorkloadSignal(Base):
    __tablename__ = "workload_signals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id = Column(String, ForeignKey("creators.id"), nullable=False)
    # reduce | maintain | increase
    signal_type = Column(String, nullable=False)
    recommended_posts_per_week = Column(Integer, nullable=False)
    best_days = Column(String, nullable=True)  # JSON-encoded list, e.g. '["Monday","Thursday"]'
    reasoning = Column(String, nullable=False)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
