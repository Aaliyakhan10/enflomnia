import uuid
from datetime import datetime, timedelta, timezone
from typing import List
from sqlalchemy.orm import Session
from app.models.content_schedule import ScheduledContent, ContentStatus
from app.schemas.content_schedule import ScheduledContentCreate, ScheduledContentUpdate
from app.services.prediction_service import PredictionService
from app.services.workload_signal import WorkloadSignalService

class SchedulerService:
    def __init__(self):
        self.prediction_service = PredictionService()
        self.workload_service = WorkloadSignalService()

    def get_schedule(self, db: Session, creator_id: str) -> List[ScheduledContent]:
        return db.query(ScheduledContent).filter(ScheduledContent.creator_id == creator_id).order_by(ScheduledContent.scheduled_at.asc()).all()

    def create_item(self, db: Session, creator_id: str, data: ScheduledContentCreate) -> ScheduledContent:
        item = ScheduledContent(
            id=f"sched_{uuid.uuid4().hex[:8]}",
            creator_id=creator_id,
            **data.model_dump()
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    def update_item(self, db: Session, item_id: str, creator_id: str, data: ScheduledContentUpdate) -> ScheduledContent:
        item = db.query(ScheduledContent).filter(ScheduledContent.id == item_id, ScheduledContent.creator_id == creator_id).first()
        if not item:
            raise ValueError("Item not found")
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(item, key, val)
        db.commit()
        db.refresh(item)
        return item

    def delete_item(self, db: Session, item_id: str, creator_id: str):
        item = db.query(ScheduledContent).filter(ScheduledContent.id == item_id, ScheduledContent.creator_id == creator_id).first()
        if item:
            db.delete(item)
            db.commit()

    def generate_smart_plan(self, db: Session, creator_id: str, days_ahead: int = 7) -> List[ScheduledContent]:
        """
        Combines Workload Signal (when to post) with Prediction Service (what to post).
        """
        # 1. Get workload signal to know WHICH days to post
        signal = self.workload_service.get_latest_signal(db, creator_id)
        if not signal:
            # Generate one on the fly if missing
            signal = self.workload_service.analyze_and_generate(db, creator_id)
        
        best_days = [d.lower() for d in signal.get("best_days", ["monday", "wednesday", "friday"])]
        if not best_days:
            best_days = ["monday", "wednesday", "friday"]

        # 2. Get content suggestions
        suggestions = self.prediction_service.generate_content_suggestions(db, creator_id)
        
        # 3. Build the schedule over the next `days_ahead`
        target_dates = []
        today = datetime.utcnow()
        for i in range(1, days_ahead + 1):
            target_date = today + timedelta(days=i)
            dow = target_date.strftime("%A").lower()
            if dow in best_days:
                # Default to 5 PM
                target_dates.append(target_date.replace(hour=17, minute=0, second=0, microsecond=0))
        
        new_items = []
        sug_idx = 0
        
        for dt in target_dates:
            # Rotate through suggestions
            sug = suggestions[sug_idx % len(suggestions)]
            sug_idx += 1
            
            topic = f"{sug.get('title', 'Content Idea')} - {sug.get('format', 'Reel')}"
            caption = f"Hook: {sug.get('hook_idea', '')}\n\nRationale: {sug.get('rationale', '')}"
            
            item = ScheduledContent(
                id=f"sched_{uuid.uuid4().hex[:8]}",
                creator_id=creator_id,
                scheduled_at=dt,
                status=ContentStatus.SUGGESTED,
                content_type="Reel",
                topic=topic,
                caption=caption
            )
            db.add(item)
            new_items.append(item)
            
        db.commit()
        for item in new_items:
            db.refresh(item)
            
        return new_items
