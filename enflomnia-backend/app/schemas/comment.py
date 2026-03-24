from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CommentIn(BaseModel):
    content: str
    author: str
    platform: str = "instagram"
    ig_media_id: Optional[str] = None


class CommentBatchIn(BaseModel):
    creator_id: str
    comments: List[CommentIn]


class CommentOut(BaseModel):
    id: str
    content: str
    author: str
    category: str
    confidence: float
    engagement_score: float
    ig_media_id: Optional[str] = None
    creator_feedback: Optional[str] = None

    class Config:
        from_attributes = True


class FeedbackIn(BaseModel):
    comment_id: str
    decision: str  # approved | rejected


class CommentSummaryOut(BaseModel):
    total: int
    spam: int
    toxic: int
    bot: int
    high_value: int
    safe: int
