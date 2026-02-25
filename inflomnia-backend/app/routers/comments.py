from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas.comment import CommentBatchIn, CommentOut, FeedbackIn, CommentSummaryOut
from app.services.comment_shield import CommentShieldService

router = APIRouter(prefix="/api/v1/comments", tags=["Comment Shield"])
service = CommentShieldService()


@router.post("/analyze", response_model=List[CommentOut], summary="Classify a batch of comments")
def analyze_comments(payload: CommentBatchIn, db: Session = Depends(get_db)):
    """
    Classify up to 20 comments using Bedrock Agent + Guardrails + bot heuristics.
    Returns each comment with category, confidence, and engagement score.
    """
    comments_dicts = [c.model_dump() for c in payload.comments]
    results = service.analyze_batch(db, payload.creator_id, comments_dicts)
    return results


@router.get("/{creator_id}", response_model=List[CommentOut], summary="Get comment history")
def get_comments(
    creator_id: str,
    category: Optional[str] = Query(None, description="Filter by: spam|toxic|bot|safe|high-value"),
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    from app.models.comment import Comment
    query = db.query(Comment).filter(Comment.creator_id == creator_id)
    if category:
        query = query.filter(Comment.category == category)
    comments = (
        query.order_by(Comment.timestamp.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return comments


@router.post("/feedback", summary="Submit creator approve/reject decision")
def submit_feedback(payload: FeedbackIn, db: Session = Depends(get_db)):
    """Store creator feedback on a classified comment."""
    if payload.decision not in ("approved", "rejected"):
        raise HTTPException(400, "decision must be 'approved' or 'rejected'")
    return service.process_feedback(db, payload.comment_id, payload.decision)


@router.get("/summary/{creator_id}", response_model=CommentSummaryOut, summary="Get filtering stats")
def get_summary(creator_id: str, db: Session = Depends(get_db)):
    """Returns counts: total | spam | toxic | bot | high-value | safe."""
    return service.get_summary(db, creator_id)
