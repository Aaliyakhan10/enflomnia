"""
Comment Shield Service
Filters toxic comments, spam, and bot-driven activity.
Uses Amazon Bedrock Guardrails + Bedrock Agent for multi-step orchestration.
Falls back to Claude 3.5 + local heuristics when Agent is not configured.
"""
import json
import re
import uuid
from typing import Optional
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.integrations.guardrails_client import GuardrailsClient
from app.integrations.bedrock_agent_client import BedrockAgentClient
from app.integrations.gemini_client import GeminiClient
from app.integrations.s3_client import S3Client


class CommentShieldService:

    CONFIDENCE_THRESHOLD = 0.8  # Below this → manual review

    def __init__(self):
        self.guardrails = GuardrailsClient()
        self.agent = BedrockAgentClient()
        self.bedrock = GeminiClient()
        self.s3 = S3Client()

    # ------------------------------------------------------------------ #
    #  Batch Analysis                                                      #
    # ------------------------------------------------------------------ #

    def analyze_batch(
        self, db: Session, creator_id: str, comments: list[dict]
    ) -> list[dict]:
        """
        Classify a batch of up to 20 comments.
        Returns list of classified comment dicts.
        """
        comments = comments[:20]  # Hard cap per Bedrock Agent limit

        # Archive raw batch to S3 for audit trail
        self.s3.archive_comments(creator_id, comments)

        # Try Bedrock Agent first, fall back to direct classification
        results = []
        if self.agent.agent_id and self.agent.agent_alias_id:
            results = self._classify_via_agent(creator_id, comments)
        else:
            results = self._classify_direct(comments)

        # Persist to DB
        saved = []
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

    def process_feedback(self, db: Session, comment_id: str, decision: str) -> dict:
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

    def get_summary(self, db: Session, creator_id: str) -> dict:
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
    #  Classification Helpers                                              #
    # ------------------------------------------------------------------ #

    def _classify_via_agent(self, creator_id: str, comments: list[dict]) -> list[dict]:
        """Invoke Bedrock Agent for multi-step classification."""
        input_text = json.dumps({
            "task": "classify_comments",
            "creator_id": creator_id,
            "comments": comments,
        })
        try:
            response_text = self.agent.invoke_agent(input_text, session_id=creator_id)
            return json.loads(response_text)
        except Exception:
            return self._classify_direct(comments)

    def _classify_direct(self, comments: list[dict]) -> list[dict]:
        """
        Fallback: Bedrock Guardrails + bot heuristics + Claude engagement scoring.
        Used when Bedrock Agent is not configured (dev mode).
        """
        results = []
        for c in comments:
            content = c.get("content", "")
            author = c.get("author", "unknown")

            # Step 1: Bedrock Guardrails (toxicity / PII)
            guardrail_result = self.guardrails.apply(content)
            if guardrail_result.blocked and guardrail_result.confidence >= self.CONFIDENCE_THRESHOLD:
                category = self._guardrail_category_to_label(guardrail_result.category)
                results.append({
                    **c,
                    "category": category,
                    "confidence": guardrail_result.confidence,
                    "engagement_score": 0.0,
                })
                continue

            # Step 2: Bot detection heuristics
            bot_score = self._bot_heuristic_score(content, author)
            if bot_score >= 0.75:
                results.append({**c, "category": "bot", "confidence": bot_score, "engagement_score": 0.0})
                continue

            # Step 3: Claude spam + engagement scoring
            classification = self._claude_classify(content)
            results.append({
                **c,
                "category": classification["category"],
                "confidence": classification["confidence"],
                "engagement_score": classification["engagement_score"],
            })

        return results

    def _guardrail_category_to_label(self, category: str) -> str:
        HATE_CATEGORIES = {"HATE", "INSULTS", "VIOLENCE", "MISCONDUCT"}
        if category in HATE_CATEGORIES:
            return "toxic"
        if category == "SEXUAL":
            return "toxic"
        return "spam"

    def _bot_heuristic_score(self, content: str, author: str) -> float:
        """Lightweight bot detection based on text patterns."""
        score = 0.0
        # Excessive emojis
        emoji_count = len(re.findall(r'[\U0001F300-\U0001FFFF]', content))
        if emoji_count > 5:
            score += 0.3
        # Repetitive characters
        if re.search(r'(.)\1{4,}', content):
            score += 0.25
        # Generic promo patterns
        promo_patterns = [r'check.*profile', r'follow.*back', r'dm.*collab', r'click.*link.*bio']
        for pattern in promo_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                score += 0.2
                break
        # All caps
        if content.isupper() and len(content) > 10:
            score += 0.15
        # Very short repeated phrases
        if len(set(content.lower().split())) < 3 and len(content.split()) > 4:
            score += 0.2
        return min(score, 1.0)

    def _claude_classify(self, content: str) -> dict:
        """Use Claude 3.5 to classify spam/safe/high-value and score engagement."""
        prompt = f"""Classify this comment. Return JSON only with keys: category (spam|safe|high-value), confidence (0-1), engagement_score (0-1).

Comment: "{content}"

Rules:
- spam: promotional, irrelevant, generic
- high-value: genuine question, specific feedback, emotional connection
- safe: normal, neutral comment

JSON only, no explanation."""
        return self.bedrock.invoke_model_json(prompt)
