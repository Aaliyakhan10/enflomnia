import uuid
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class Script(Base):
    """A Claude-generated branded content script."""
    __tablename__ = "scripts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id = Column(String, nullable=False, index=True)
    brand_name = Column(String, nullable=True)
    topic = Column(String, nullable=False)
    tone = Column(String, nullable=False, default="entertaining")  # educational | entertaining | inspiring
    hook = Column(Text, nullable=True)            # opening line / hook
    structure = Column(Text, nullable=True)       # JSON: [{section, content, duration_s}]
    cta = Column(Text, nullable=True)             # call-to-action
    tips = Column(Text, nullable=True)            # JSON: [tip strings]
    reasoning = Column(Text, nullable=True)       # Claude's notes on approach
    created_at = Column(DateTime(timezone=True), server_default=func.now())
