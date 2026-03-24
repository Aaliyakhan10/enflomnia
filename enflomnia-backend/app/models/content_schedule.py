from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum
from app.database import Base
from datetime import datetime
import enum

class ContentStatus(str, enum.Enum):
    SUGGESTED = "suggested"
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    CANCELLED = "cancelled"

class ScheduledContent(Base):
    __tablename__ = "scheduled_content"

    id = Column(String, primary_key=True, index=True)
    creator_id = Column(String, index=True, nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(ContentStatus), default=ContentStatus.SUGGESTED, nullable=False)
    
    content_type = Column(String, nullable=False) # e.g. Reel, Story, Post
    topic = Column(String, nullable=True) # E.g. AI Content Suggestions
    caption = Column(Text, nullable=True)
    media_url = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
