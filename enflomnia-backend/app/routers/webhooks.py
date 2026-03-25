from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.listener_service import ListenerService

router = APIRouter(prefix="/api/webhooks", tags=["Nutrient Cycle Webhooks"])

@router.post("/instagram/engagement")
def receive_instagram_engagement(payload: dict, enterprise_id: str, db: Session = Depends(get_db)):
    """
    Webhook endpoint to receive Instagram comments and metrics.
    Requires `enterprise_id` as a query parameter in a real world scenario, 
    but for this hackathon we pass it directly or map it via token.
    """
    listener = ListenerService(db)
    return listener.process_engagement_webhook(enterprise_id, payload)
