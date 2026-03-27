"""
Video Service — The Director / Remotion Integrator
Handles video metadata persistence and coordinates with the Remotion Render API.
"""
import uuid
import requests
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.video import Video
from app.integrations.gemini_client import GeminiClient
from app.config import get_settings

settings = get_settings()
AGENT_NAME = "video_studio"

class VideoService:
    def __init__(self, db: Session):
        self.db = db
        self.gemini = GeminiClient()
        self.frontend_url = "http://localhost:3000" # Should come from settings in prod

    def create_video_request(
        self, 
        enterprise_id: str, 
        title: str, 
        input_props: dict, 
        script_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> Video:
        """Create a new video record and trigger the Remotion render."""
        video = Video(
            id=str(uuid.uuid4()),
            enterprise_id=enterprise_id,
            title=title,
            script_id=script_id,
            input_props=input_props,
            status="pending"
        )
        self.db.add(video)
        self.db.commit()
        self.db.refresh(video)
        
        # Trigger async render (in a real app, this would be a background task)
        # For now, we'll try to call the frontend API directly or return the pending state
        return video

    def list_videos(self, enterprise_id: str) -> List[Video]:
        return self.db.query(Video).filter(Video.enterprise_id == enterprise_id).order_by(Video.created_at.desc()).all()

    def get_video(self, video_id: str) -> Optional[Video]:
        return self.db.query(Video).filter(Video.id == video_id).first()

    def update_video_status(self, video_id: str, status: str, video_url: Optional[str] = None, error: Optional[str] = None):
        video = self.get_video(video_id)
        if video:
            video.status = status
            if video_url:
                video.video_url = video_url
            if error:
                video.error_message = error
            self.db.commit()
            self.db.refresh(video)
        return video
