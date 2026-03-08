import uuid
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base

class AIInsight(Base):
    """Generic model to cache AI responses for various creator insights."""
    __tablename__ = "ai_insights"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id = Column(String, nullable=False, index=True)
    insight_type = Column(String, nullable=False, index=True) # e.g. 'suggestions', 'growth_simulation'
    content = Column(JSON, nullable=False)
    generated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
