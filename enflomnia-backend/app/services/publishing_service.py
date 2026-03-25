import time
from sqlalchemy.orm import Session
from app.services.data_guard import DataGuardService

class PublishingService:
    def __init__(self, db: Session):
        self.db = db
        self.guard = DataGuardService(db)

    def publish_content(self, enterprise_id: str, payload: dict) -> dict:
        """
        The Fruit Phase: Pushes approved content out to social graphs via APIs.
        Mocks an Instagram Graph API publish action.
        """
        # 1. Log the publish intent via Data Guard (Accountability)
        self.guard.log_access(enterprise_id, "Publish Action Triggered: Instagram", "Social Postman")
        
        # 2. Extract content
        content_type = payload.get("type", "unknown")
        day = payload.get("day", "Now")
        
        # 3. Simulate external API network delay and graph API response
        time.sleep(1.5)
        
        # 4. Return success mock response mimicking Instagram Graph API schema
        return {
            "id": f"ig_{int(time.time())}",
            "status": "success",
            "message": f"Successfully published {content_type} for {day} to Instagram.",
            "metrics_url": "/dashboard/analytics"
        }
