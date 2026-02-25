import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import enum


class Platform(str, enum.Enum):
    instagram = "instagram"
    youtube = "youtube"
    tiktok = "tiktok"


class Creator(Base):
    __tablename__ = "creators"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    platform = Column(String, nullable=False)
    username = Column(String, nullable=False, unique=True)
    follower_count = Column(Integer, nullable=False, default=0)
    niche = Column(String, nullable=False, default="general")
    engagement_rate = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
