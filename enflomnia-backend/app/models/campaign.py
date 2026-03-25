from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.database import Base

class CampaignStrategy(Base):
    __tablename__ = "campaign_strategies"

    id = Column(String, primary_key=True, index=True)
    enterprise_id = Column(String, ForeignKey("enterprises.id"), nullable=False)
    goal = Column(String, nullable=False)
    title = Column(String, nullable=False)
    proposed_scripts = Column(JSON, nullable=False)
    engagement_playbook = Column(JSON, nullable=False)
    reach_forecast = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
