from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.content_schedule import (
    ScheduledContentCreate,
    ScheduledContentUpdate,
    ScheduledContentOut,
    SmartPlanRequestIn
)
from app.services.scheduler_service import SchedulerService

router = APIRouter(prefix="/api/v1/scheduler", tags=["Content Scheduler"])
_svc = SchedulerService()

@router.get("/{creator_id}", response_model=List[ScheduledContentOut], summary="Get content schedule for a creator")
def get_schedule(creator_id: str, db: Session = Depends(get_db)):
    try:
        return _svc.get_schedule(db, creator_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{creator_id}", response_model=ScheduledContentOut, summary="Create a new scheduled content item")
def create_item(creator_id: str, payload: ScheduledContentCreate, db: Session = Depends(get_db)):
    try:
        return _svc.create_item(db, creator_id, payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{creator_id}/{item_id}", response_model=ScheduledContentOut, summary="Update a scheduled item")
def update_item(creator_id: str, item_id: str, payload: ScheduledContentUpdate, db: Session = Depends(get_db)):
    try:
        return _svc.update_item(db, item_id, creator_id, payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{creator_id}/{item_id}", summary="Delete a scheduled item")
def delete_item(creator_id: str, item_id: str, db: Session = Depends(get_db)):
    try:
        _svc.delete_item(db, item_id, creator_id)
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/smart-plan/generate", response_model=List[ScheduledContentOut], summary="Generate an AI-driven smart content plan")
def generate_smart_plan(payload: SmartPlanRequestIn, db: Session = Depends(get_db)):
    try:
        return _svc.generate_smart_plan(db, payload.creator_id, payload.days_ahead)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
