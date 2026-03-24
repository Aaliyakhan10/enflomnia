from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReachSnapshotIn(BaseModel):
    creator_id: str
    reach: int
    impressions: int = 0


class ReachSnapshotOut(BaseModel):
    id: str
    creator_id: str
    reach: int
    impressions: int
    anomaly_type: Optional[str] = None
    anomaly_confidence: Optional[float] = None
    anomaly_reasoning: Optional[str] = None
    recorded_at: datetime

    class Config:
        from_attributes = True


class AnomalyResult(BaseModel):
    anomaly_type: str  # none | creator_specific | platform_wide
    confidence: float
    drop_percentage: Optional[float] = None
    baseline_reach: Optional[int] = None
    current_reach: Optional[int] = None
    reasoning: str
