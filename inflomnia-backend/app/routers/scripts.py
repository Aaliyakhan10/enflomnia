from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.script import ScriptRequestIn, ScriptOut
from app.services.script_service import ScriptService
from app.models.reel import Reel

router = APIRouter(prefix="/api/v1/scripts", tags=["Scripts"])
_svc = ScriptService()


@router.post("/generate", summary="Generate a branded content script with hook and structure")
def generate_script(payload: ScriptRequestIn, db: Session = Depends(get_db)):
    try:
        topic = payload.topic
        if not topic and payload.reel_id:
            reel = db.query(Reel).filter(Reel.id == payload.reel_id, Reel.creator_id == payload.creator_id).first()
            if reel:
                topic = f"Content similar to this existing reel hook/caption: '{reel.caption}'"
            else:
                topic = "General unscripted topic based on my recent content style"
        elif not topic:
            topic = "General lifestyle or current trends"

        return _svc.generate_script(
            db=db,
            creator_id=payload.creator_id,
            topic=topic,
            brand_name=payload.brand_name,
            brand_brief=payload.brand_brief,
            tone=payload.tone,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{creator_id}", summary="Get past generated scripts")
def get_history(creator_id: str, limit: int = 20, db: Session = Depends(get_db)):
    return _svc.get_history(db, creator_id, limit)
