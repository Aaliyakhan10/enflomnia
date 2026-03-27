"""
Comment Shield Service → The Aegis
Filters toxic comments, spam, and bot-driven activity.
Uses Gemini for classification with Langfuse observability.
"""
import json
import re
import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.integrations.gemini_client import GeminiClient
from app.services.knowledge_lake import KnowledgeLakeService


AGENT_NAME = "aegis"


class CommentShieldService:

    CONFIDENCE_THRESHOLD = 0.8

    def __init__(self):
        self.gemini = GeminiClient()
        self.knowledge_svc = KnowledgeLakeService()

    # ------------------------------------------------------------------ #
    #  Batch Analysis                                                      #
    # ------------------------------------------------------------------ #

    def analyze_batch(
        self, db: Session, creator_id: str, comments: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Classify a batch of up to 20 comments."""
        comments = comments[:20]  # type: ignore

        saved = []
        to_analyze = []

        for item in comments:
            content = item.get("content", "")
            author = item.get("author", "unknown")
            media_id = item.get("ig_media_id")

            existing = db.query(Comment).filter(
                Comment.creator_id == creator_id,
                Comment.content == content,
                Comment.author == author,
                Comment.ig_media_id == media_id
            ).first()

            if existing:
                saved.append({
                    "id": existing.id,
                    "content": existing.content,
                    "author": existing.author,
                    "category": existing.category,
                    "confidence": existing.confidence,
                    "engagement_score": existing.engagement_score,
                    "ig_media_id": existing.ig_media_id,
                    "creator_feedback": existing.creator_feedback,
                })
            else:
                to_analyze.append(item)

        if to_analyze:
            results = self._classify_direct(db, creator_id, to_analyze)

            for item in results:
                comment = Comment(
                    creator_id=creator_id,
                    ig_media_id=item.get("ig_media_id"),
                    platform=item.get("platform", "instagram"),
                    content=item["content"],
                    author=item.get("author", "unknown"),
                    category=item["category"],
                    confidence=item["confidence"],
                    engagement_score=item.get("engagement_score", 0.0),
                )
                db.add(comment)
                db.commit()
                db.refresh(comment)
                saved.append({
                    "id": comment.id,
                    "content": comment.content,
                    "author": comment.author,
                    "category": comment.category,
                    "confidence": comment.confidence,
                    "engagement_score": comment.engagement_score,
                    "ig_media_id": comment.ig_media_id,
                    "creator_feedback": None,
                })

        return saved

    # ------------------------------------------------------------------ #
    #  Feedback                                                            #
    # ------------------------------------------------------------------ #

    def process_feedback(self, db: Session, comment_id: str, decision: str) -> Dict[str, Any]:
        """Store creator approve/reject decision."""
        comment = db.query(Comment).filter(Comment.id == comment_id).first()
        if not comment:
            return {"success": False, "error": "Comment not found"}

        comment.creator_feedback = decision
        db.commit()
        return {"success": True, "comment_id": comment_id, "decision": decision}

    # ------------------------------------------------------------------ #
    #  Summary Stats                                                       #
    # ------------------------------------------------------------------ #

    def get_summary(self, db: Session, creator_id: str) -> Dict[str, Any]:
        """Returns filtering summary counts for the dashboard."""
        comments = db.query(Comment).filter(Comment.creator_id == creator_id).all()
        total = len(comments)
        return {
            "total": total,
            "spam": sum(1 for c in comments if c.category == "spam"),
            "toxic": sum(1 for c in comments if c.category == "toxic"),
            "bot": sum(1 for c in comments if c.category == "bot"),
            "high_value": sum(1 for c in comments if c.category == "high-value"),
            "safe": sum(1 for c in comments if c.category == "safe"),
        }

    # ------------------------------------------------------------------ #
    #  Classification                                                      #
    # ------------------------------------------------------------------ #

    def _classify_direct(self, db: Session, enterprise_id: str, comments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Classify using bot heuristics + Gemini reasoning."""
        # Fetch global context
        context = self.knowledge_svc.get_context_for_agent(db, enterprise_id, "comment analysis")
        
        results = []
        for c in comments:
            content = c.get("content", "")
            author = c.get("author", "unknown")

            # Step 1: Bot detection heuristics
            bot_score = self._bot_heuristic_score(content, author)
            if bot_score >= 0.75:
                results.append({**c, "category": "bot", "confidence": bot_score, "engagement_score": 0.0})
                continue

            # Step 2: Gemini spam + engagement scoring
            classification = self._gemini_classify(content, context)
            results.append({
                **c,
                "category": classification["category"],
                "confidence": classification["confidence"],
                "engagement_score": classification["engagement_score"],
            })

        return results

    def _bot_heuristic_score(self, content: str, author: str) -> float:
        """Lightweight bot detection based on text patterns."""
        score: float = 0.0
        emoji_count: int = len(re.findall(r'[\U0001F300-\U0001FFFF]', content))
        if emoji_count > 5:
            score += 0.3
        if re.search(r'(.)\1{4,}', content):
            score += 0.25
        promo_patterns = [r'check.*profile', r'follow.*back', r'dm.*collab', r'click.*link.*bio']
        for pattern in promo_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                score += 0.2
                break
        if content.isupper() and len(content) > 10:
            score += 0.15
        if len(set(content.lower().split())) < 3 and len(content.split()) > 4:
            score += 0.2
        return min(score, 1.0)

    def _gemini_classify(self, content: str, context: Optional[str] = None) -> Dict[str, Any]:
        """Use Gemini to classify spam/safe/high-value and score engagement."""
        context_block = f"\n\nContext from Knowledge Lake:\n{context}" if context else ""
        
        prompt = f"""Classify this comment. Return JSON only with keys: category (spam|safe|high-value), confidence (0-1), engagement_score (0-1).
{context_block}

Comment: "{content}"

Rules:
- spam: promotional, irrelevant, generic
- high-value: genuine question, specific feedback, emotional connection
- safe: normal, neutral comment

JSON only, no explanation."""
        return self.gemini.invoke_model_json(prompt, agent_name=AGENT_NAME)
