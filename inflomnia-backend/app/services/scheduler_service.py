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
        # 1. Get workload signal to know WHICH days to post and HOW OFTEN
        signal = self.workload_service.get_latest_signal(db, creator_id)
        if not signal:
            # Generate one on the fly if missing
            signal = self.workload_service.analyze_and_generate(db, creator_id)
        
        best_days = [d.lower() for d in signal.get("best_days", ["monday", "wednesday", "friday"])]
        rec_per_week = signal.get("recommended_posts_per_week", 3)
        
        if not best_days:
            best_days = ["monday", "wednesday", "friday"]

        # 2. Get content suggestions
        suggestions = self.prediction_service.generate_content_suggestions(db, creator_id)
        if not suggestions:
            # Fallback if no suggestions
            suggestions = [{"title": "Dynamic Content", "format": "Reel", "hook_idea": "Stay consistent!", "rationale": "High engagement slot."}]
        
        # 3. Build the schedule over the next `days_ahead`
        target_dates = []
        today = datetime.utcnow()
        
        # We want to fit `rec_per_week` posts into a 7-day window.
        # If days_ahead > 7, we scale.
        total_posts_needed = int((rec_per_week / 7) * days_ahead)
        if total_posts_needed < 1:
            total_posts_needed = 1

        # Find all matching "best days" in the window
        potential_slots = []
        for i in range(1, days_ahead + 1):
            dt = today + timedelta(days=i)
            dow = dt.strftime("%A").lower()
            if dow in best_days:
                # Get dynamic peak hour
                peak_hour = self.workload_service.get_best_time_for_day(db, creator_id, dow)
                slot_time = dt.replace(hour=peak_hour, minute=0, second=0, microsecond=0)
                potential_slots.append(slot_time)

        # If we have more best days than needed, we take the top ones (already ordered by best_days usually)
        # If we have fewer, we might need to add more days.
        # For simplicity, we'll take all potential slots up to total_posts_needed.
        # If potential_slots is empty (unlikely with fallbacks), we'll just add tomorrow.
        
        if not potential_slots:
            tomorrow = today + timedelta(days=1)
            peak_hour = self.workload_service.get_best_time_for_day(db, creator_id, tomorrow.strftime("%A"))
            potential_slots.append(tomorrow.replace(hour=peak_hour, minute=0, second=0, microsecond=0))

        # Truncate or pad to match total_posts_needed if possible
        # But usually we just want to fill the "best days" within the window.
        # Let's stick to the best days found, but ensure we don't exceed a reasonable cap
        # or fall too short of the recommendation.
        
        scheduled_slots = potential_slots[:total_posts_needed]
        
        new_items = []
        sug_idx = 0
        
        for dt in scheduled_slots:
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
