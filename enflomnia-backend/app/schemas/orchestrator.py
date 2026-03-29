from pydantic import BaseModel
from typing import Optional

class MasterFlowRequest(BaseModel):
    creator_id: str
    enterprise_id: str
    seed_info: Optional[dict] = None  # {"title": "...", "content": "..."}
    topic: Optional[str] = None
    tone: str = "entertaining"
    publish_automatically: bool = True
