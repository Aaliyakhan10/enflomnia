import uuid
from sqlalchemy import Column, String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from app.database import Base
import enum


class CommentCategory(str, enum.Enum):
    spam = "spam"
    toxic = "toxic"
    bot = "bot"
    safe = "safe"
    high_value = "high-value"


class CreatorFeedback(str, enum.Enum):
    approved = "approved"
    rejected = "rejected"


class Comment(Base):
    __tablename__ = "comments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id = Column(String, ForeignKey("creators.id"), nullable=False)
    platform = Column(String, nullable=False, default="instagram")
    content = Column(String, nullable=False)
    author = Column(String, nullable=False)
    category = Column(String, nullable=True)  # spam|toxic|bot|safe|high-value
    confidence = Column(Float, nullable=True, default=0.0)
    engagement_score = Column(Float, nullable=True, default=0.0)
    creator_feedback = Column(String, nullable=True)  # approved|rejected
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
