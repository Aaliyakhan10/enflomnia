from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class ScriptIdea(BaseModel):
    day: str
    format: str
    topic: str
    rationale: str
    hook: str
    body_points: List[str]
    call_to_action: str
    image_prompt: str
    video_prompt: str

class ReplyStrategy(BaseModel):
    anticipated_comment: str
    suggested_reply: str
    tone: str

class CampaignCreate(BaseModel):
    goal: str

class CampaignResponse(BaseModel):
    id: str
    enterprise_id: str
    goal: str
    title: str
    proposed_scripts: List[ScriptIdea]
    engagement_playbook: List[ReplyStrategy]
    reach_forecast: str
    created_at: datetime

    class Config:
        from_attributes = True
