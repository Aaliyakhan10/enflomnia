import uuid
from sqlalchemy import Column, String, Integer, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class InstagramAccount(Base):
    """Stores a creator's connected Instagram account and access token."""
    __tablename__ = "instagram_accounts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id = Column(String, nullable=False, unique=True, index=True)
    ig_user_id = Column(String, nullable=False)
    username = Column(String, nullable=True)
    name = Column(String, nullable=True)
    profile_picture_url = Column(String, nullable=True)
    followers_count = Column(Integer, nullable=True)
    media_count = Column(Integer, nullable=True)
    account_type = Column(String, nullable=True)   # PERSONAL | BUSINESS | MEDIA_CREATOR
    access_token = Column(Text, nullable=False)     # stored in DB for re-use
    connected_at = Column(DateTime(timezone=True), server_default=func.now())
    last_synced_at = Column(DateTime(timezone=True), nullable=True)

    # ── AI Analysis Cache ──
    overall_insights = Column(Text, nullable=True)
    top_performing_pattern = Column(Text, nullable=True)
    recommended_posting_style = Column(Text, nullable=True)
    insights_last_generated_at = Column(DateTime(timezone=True), nullable=True)
