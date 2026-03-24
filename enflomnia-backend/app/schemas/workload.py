from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class WorkloadSignalOut(BaseModel):
    id: str
    signal_type: str  # reduce | maintain | increase
    recommended_posts_per_week: int
    best_days: List[str]
    reasoning: str
    generated_at: str


class HeatmapOut(BaseModel):
    # day -> list of 24 hourly engagement scores
    Monday: List[float]
    Tuesday: List[float]
    Wednesday: List[float]
    Thursday: List[float]
    Friday: List[float]
    Saturday: List[float]
    Sunday: List[float]
