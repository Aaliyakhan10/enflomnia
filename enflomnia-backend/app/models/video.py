import uuid
from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Video(Base):
    """Model to store metadata and state of AI-generated videos via Remotion."""
    __tablename__ = "videos"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    enterprise_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    script_id = Column(String, ForeignKey("scripts.id"), nullable=True)
    
    # Stores the full Remotion input props (images, captions, etc.)
    input_props = Column(JSON, nullable=False)
    
    # State and resulting assets
    status = Column(String, default="pending")  # pending, rendering, completed, failed
    video_url = Column(String, nullable=True)   # Public URL to the MP4
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
