from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas.comment import CommentBatchIn, CommentOut, FeedbackIn, CommentSummaryOut
from app.services.comment_shield import CommentShieldService
from app.integrations.instagram_client import InstagramClient
from app.integrations.bedrock_client import BedrockClient
from app.models.instagram_account import InstagramAccount
import json

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


@router.post("/sync-reel/{creator_id}/{ig_media_id}", response_model=List[CommentOut], summary="Sync & Analyze Real Comments for a Reel")
def sync_reel_comments(creator_id: str, ig_media_id: str, db: Session = Depends(get_db)):
    """
    Fetch real comments for a Reel from the Instagram API,
    and pipe them through Bedrock for spam/toxicity analysis.
    """
    account = db.query(InstagramAccount).filter(InstagramAccount.creator_id == creator_id).first()
    if not account or not account.access_token:
        raise HTTPException(status_code=400, detail="Instagram account not connected")

    if account.access_token == "mock_token_123" or not account.access_token:
        # Generate mock comments for the UI using Bedrock
        bedrock = BedrockClient()
        prompt = f"Generate 15 short Instagram comments for a reel (media ID: {ig_media_id}). Include a mix of supportive comments, 2 spam/bot comments, and 1 slightly toxic/negative comment. Return ONLY a JSON array of objects with keys 'text' (the comment) and 'username' (a fake handle)."
        try:
            raw_res = bedrock.invoke_claude(prompt, max_tokens=1000)
            clean = raw_res.strip()
            if clean.startswith("```"):
                clean = clean.split("```")[1]
                if clean.startswith("json"):
                    clean = clean[4:]
            raw_comments = json.loads(clean)
        except Exception:
            raw_comments = [
                {"text": "Love this so much! 🔥", "username": "fan_123"},
                {"text": "DM @promo_bot for paid collab 📈", "username": "promo_bot"},
                {"text": "This is terrible content.", "username": "hater_99"},
            ]
    else:
        try:
            client = InstagramClient(account.access_token)
            raw_comments = client.get_media_comments(ig_media_id, limit=20)
            client.close()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch comments: {str(e)}")

    if not raw_comments:
        return []

    # Map directly for analyze_batch
    comments_input = []
    for rc in raw_comments:
        comments_input.append({
            "content": rc.get("text", ""),
            "author": rc.get("username", "unknown"),
            "platform": "instagram",
            "ig_media_id": ig_media_id
        })
    
    # Process through Comment Shield (Bedrock)
    results = service.analyze_batch(db, creator_id, comments_input)
    return results

@router.get("/{creator_id}", response_model=List[CommentOut], summary="Get comment history")
def get_comments(
    creator_id: str,
    category: Optional[str] = Query(None, description="Filter by: spam|toxic|bot|safe|high-value"),
    ig_media_id: Optional[str] = Query(None, description="Filter by a specific Reel ID"),
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    from app.models.comment import Comment
    query = db.query(Comment).filter(Comment.creator_id == creator_id)
    if category:
        query = query.filter(Comment.category == category)
    if ig_media_id:
        query = query.filter(Comment.ig_media_id == ig_media_id)
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
