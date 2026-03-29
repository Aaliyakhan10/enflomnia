import uuid
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class GeneratedImage(Base):
    """Model to store AI-generated images from Gemini."""
    __tablename__ = "generated_images"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    enterprise_id = Column(String, nullable=False, index=True)
    user_email = Column(String, nullable=True, index=True)
    prompt = Column(Text, nullable=False)
    image_data = Column(Text, nullable=False) # Base64 or URL
    caption = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
