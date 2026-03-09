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
        
        # 3. Build prioritized slots
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        potential_slots = []
        
        for i in range(1, days_ahead + 1):
            dt = today + timedelta(days=i)
            dow = dt.strftime("%A").lower()
            if dow in best_days:
                # 3a. Find Peak Slot
                peak_h = self.workload_service.get_best_time_for_day(db, creator_id, dow)
                peak_score = self.workload_service.get_slot_score(db, creator_id, dow, peak_h)
                potential_slots.append({"time": dt.replace(hour=peak_h), "type": "peak", "score": peak_score})
                
                # 3b. Find Morning Slot (best between 7 AM and 11 AM)
                morning_scores = [(h, self.workload_service.get_slot_score(db, creator_id, dow, h)) for h in range(7, 12)]
                morning_h, morning_score = max(morning_scores, key=lambda x: x[1])
                potential_slots.append({"time": dt.replace(hour=morning_h), "type": "morning", "score": morning_score})

                # 3c. Find Niche/Afternoon Slot (best between 1 PM and 5 PM)
                niche_scores = [(h, self.workload_service.get_slot_score(db, creator_id, dow, h)) for h in range(13, 18)]
                niche_h, niche_score = max(niche_scores, key=lambda x: x[1])
                potential_slots.append({"time": dt.replace(hour=niche_h), "type": "niche", "score": niche_score})

        # 4. Filter and Limit slots to match recommended posts per week
        # We sort by score to ensure we pick the absolute best slots across the week first
        potential_slots.sort(key=lambda x: x["score"], reverse=True)
        total_posts_needed = int((rec_per_week / 7) * days_ahead)
        if total_posts_needed < 1: total_posts_needed = 1
        
        # Take the top N slots and re-sort them chronologically
        final_slots = potential_slots[:total_posts_needed]
        final_slots.sort(key=lambda x: x["time"])
        
        # 5. Distribute suggestions to matching slot types
        new_items = []
        
        for slot in final_slots:
            # Try to find a suggestion that matches the slot type
            match = next((s for s in suggestions if s.get("preferred_time_type") == slot["type"]), suggestions[0])
            
            topic = f"{match.get('title', 'Content Idea')} - {match.get('format', 'Reel')}"
            caption = (
                f"Hook: {match.get('hook_idea', '')}\n\n"
                f"Rationale: {match.get('rationale', '')}\n\n"
                f"Slot Strategy: Optimized for {slot['type'].upper()} engagement."
            )
            
            item = ScheduledContent(
                id=f"sched_{uuid.uuid4().hex[:8]}",
                creator_id=creator_id,
                scheduled_at=slot["time"],
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
