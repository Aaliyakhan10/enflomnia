from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.content_schedule import ContentStatus

class ScheduledContentBase(BaseModel):
    scheduled_at: Optional[datetime] = None
    status: ContentStatus = ContentStatus.SUGGESTED
    content_type: str = "Reel"
    topic: Optional[str] = None
    caption: Optional[str] = None
    media_url: Optional[str] = None

class ScheduledContentCreate(ScheduledContentBase):
    pass

class ScheduledContentUpdate(ScheduledContentBase):
    pass

class ScheduledContentOut(ScheduledContentBase):
    id: str
    creator_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SmartPlanRequestIn(BaseModel):
    creator_id: str = Field(..., description="The user's creator ID")
    days_ahead: int = Field(7, description="How many days ahead to schedule")
