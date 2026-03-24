from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ConnectInstagramIn(BaseModel):
    creator_id: str
    access_token: str   # long-lived token from Graph API Explorer or Meta OAuth


class InstagramAccountOut(BaseModel):
    creator_id: str
    ig_user_id: str
    username: Optional[str]
    name: Optional[str]
    profile_picture_url: Optional[str]
    followers_count: Optional[int]
    media_count: Optional[int]
    account_type: Optional[str]
    connected_at: datetime

    class Config:
        from_attributes = True


class ReelMetrics(BaseModel):
    ig_media_id: str
    permalink: Optional[str]
    thumbnail_url: Optional[str]
    caption: Optional[str]
    published_at: Optional[datetime]
    like_count: int = 0
    comments_count: int = 0
    reach: Optional[int] = None
    plays: Optional[int] = None
    saved: Optional[int] = None
    total_interactions: Optional[int] = None
    avg_watch_time_ms: Optional[float] = None
    engagement_rate: Optional[float] = None

    class Config:
        from_attributes = True


class ReelAnalysisOut(BaseModel):
    ig_media_id: str
    permalink: Optional[str]
    thumbnail_url: Optional[str]
    caption: Optional[str]
    published_at: Optional[datetime]
    like_count: int = 0
    comments_count: int = 0
    reach: Optional[int] = None
    plays: Optional[int] = None
    saved: Optional[int] = None
    avg_watch_time_ms: Optional[float] = None
    hook_quality_score: Optional[float] = None
    analysis_summary: Optional[str] = None
    best_practices: Optional[list] = None
    improvement_tips: Optional[list] = None

    class Config:
        from_attributes = True


class ReelBatchAnalysisOut(BaseModel):
    account: InstagramAccountOut
    reels: List[ReelAnalysisOut]
    overall_insights: str
    top_performing: Optional[str] = None
    recommended_posting_style: Optional[str] = None
