"""
Content Intelligence & Prediction Service → The DNA & Soil
Handles content suggestions, reel feedback, competitor/trend analysis,
and growth simulations using Gemini 2.5 with Langfuse tracing.
"""
import json
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any

from sqlalchemy.orm import Session

from app.integrations.gemini_client import GeminiClient
from app.models.reel import Reel
from app.models.instagram_account import InstagramAccount
from app.models.ai_insight import AIInsight

AGENT_NAME = "dna_soil"


class PredictionService:

    def __init__(self):
        self.gemini = GeminiClient()

    # ── 1. Content Suggestions ──────────────────────────────────────────────

    def generate_content_suggestions(self, db: Session, creator_id: str) -> List[Dict[str, Any]]:
        cached = db.query(AIInsight).filter(AIInsight.creator_id == creator_id, AIInsight.insight_type == "suggestions").first()
        if cached:
            delta = datetime.now(timezone.utc) - cached.generated_at.replace(tzinfo=timezone.utc)
            if delta < timedelta(hours=24):
                return cached.content

        account = db.query(InstagramAccount).filter(InstagramAccount.creator_id == creator_id).first()
        follower_count = account.followers_count if account else 0
        niche = "general"

        reels = db.query(Reel).filter(Reel.creator_id == creator_id).all()
        total_reach = sum(r.reach or 0 for r in reels)
        total_interactions = sum(r.total_interactions or 0 for r in reels)
        engagement_rate = (total_interactions / total_reach) if total_reach > 0 else 0

        reels.sort(key=lambda x: x.total_interactions or 0, reverse=True)
        top_reels = reels[:5]

        context_str = "\n".join([f"- Captions: '{(r.caption or '')[:50]}...', Reach: {r.reach}, Interactions: {r.total_interactions}" for r in top_reels])

        prompt = f"""You are an elite Instagram growth strategist.
The creator is in the '{niche}' niche with {follower_count} followers.
Their average engagement rate is {engagement_rate:.1%}.

Here are their recent top performing reels:
{context_str}

Suggest exactly 3 new specific content formats/topics to maximize engagement.
For each, specify a "preferred_time_type": "peak", "morning", or "niche".

Return ONLY valid JSON:
[
  {{
    "title": "Short title",
    "format": "e.g., POV, Tutorial, VLOG",
    "rationale": "Why this will work, citing specific metrics.",
    "hook_idea": "A 1-sentence opening hook (max 15 words).",
    "preferred_time_type": "peak" | "morning" | "niche"
  }}
]"""
        result = self.gemini.invoke_model_json(prompt, agent_name=AGENT_NAME)

        if not cached:
            cached = AIInsight(creator_id=creator_id, insight_type="suggestions")
            db.add(cached)
        cached.content = result
        db.commit()

        return result

    # ── 2. Reel Feedback ────────────────────────────────────────────────────

    def analyze_reel_feedback(self, db: Session, creator_id: str, reel_id: str) -> Dict[str, str]:
        cache_key = f"reel_feedback_{reel_id}"
        cached = db.query(AIInsight).filter(AIInsight.creator_id == creator_id, AIInsight.insight_type == cache_key).first()
        if cached:
            delta = datetime.now(timezone.utc) - cached.generated_at.replace(tzinfo=timezone.utc)
            if delta < timedelta(hours=24):
                return cached.content

        reel = db.query(Reel).filter(Reel.id == reel_id, Reel.creator_id == creator_id).first()
        if not reel:
            return {"error": "Reel not found"}

        prompt = f"""You are a content coach. Give short, punchy feedback on this Instagram Reel.
Caption: {reel.caption}
Reach: {reel.reach} | Plays: {reel.plays} | Likes: {reel.like_count}
Comments: {reel.comments_count} | Saves: {reel.saved} | Watch Time Avg (ms): {reel.avg_watch_time_ms}

Return ONLY valid JSON:
{{
  "what_worked": "1 sentence on a structural strength",
  "what_to_improve": "1 sentence on a specific weakness",
  "next_iteration": "1 specific, actionable editing idea"
}}"""
        result = self.gemini.invoke_model_json(prompt, agent_name=AGENT_NAME)

        if not cached:
            cached = AIInsight(creator_id=creator_id, insight_type=cache_key)
            db.add(cached)
        cached.content = result
        db.commit()

        return result

    # ── 3. Competitors & Trends ─────────────────────────────────────────────

    def find_competitors_and_trends(self, db: Session, creator_id: str, niche: str) -> Dict[str, Any]:
        cache_key = f"trends_{niche}"
        cached = db.query(AIInsight).filter(AIInsight.creator_id == creator_id, AIInsight.insight_type == cache_key).first()
        if cached:
            delta = datetime.now(timezone.utc) - cached.generated_at.replace(tzinfo=timezone.utc)
            if delta < timedelta(hours=24):
                return cached.content

        account = db.query(InstagramAccount).filter(InstagramAccount.creator_id == creator_id).first()
        follower_count = account.followers_count if account else 0

        prompt = f"""You are an Instagram trends analyst.
The creator is in the '{niche}' niche with {follower_count} followers.

Identify 2 emerging content trends and 2 competitor handles to study.
Return ONLY valid JSON:
{{
  "competitors_to_watch": ["@competitor_one", "@competitor_two"],
  "emerging_trends": [
    {{"trend_name": "Trend 1", "description": "Actionable explanation."}},
    {{"trend_name": "Trend 2", "description": "Actionable explanation."}}
  ]
}}"""
        result = self.gemini.invoke_model_json(prompt, agent_name=AGENT_NAME)

        if not cached:
            cached = AIInsight(creator_id=creator_id, insight_type=cache_key)
            db.add(cached)
        cached.content = result
        db.commit()

        return result

    # ── 4. Growth Simulation ────────────────────────────────────────────────

    def simulate_growth(self, db: Session, creator_id: str) -> Dict[str, Any]:
        cached = db.query(AIInsight).filter(AIInsight.creator_id == creator_id, AIInsight.insight_type == "growth_simulation").first()
        if cached:
            delta = datetime.now(timezone.utc) - cached.generated_at.replace(tzinfo=timezone.utc)
            if delta < timedelta(hours=24):
                return cached.content

        account = db.query(InstagramAccount).filter(InstagramAccount.creator_id == creator_id).first()
        current_followers = account.followers_count if account else 0

        reels = db.query(Reel).filter(Reel.creator_id == creator_id).all()
        total_reach = sum(r.reach or 0 for r in reels)
        total_interactions = sum(r.total_interactions or 0 for r in reels)
        engagement_rate = (total_interactions / total_reach) if total_reach > 0 else 0

        prompt = f"""You are a predictive data modeler.
The creator has {current_followers} followers, {engagement_rate:.1%} engagement.

Provide 3, 6, and 12-month growth projections and 1 strategic pivot recommendation.
Return ONLY valid JSON:
{{
  "projections": [
    {{"month": 3, "projected_followers": 0}},
    {{"month": 6, "projected_followers": 0}},
    {{"month": 12, "projected_followers": 0}}
  ],
  "strategic_pivot": "2-sentence strategic recommendation."
}}"""
        parsed = self.gemini.invoke_model_json(prompt, agent_name=AGENT_NAME)

        if not cached:
            cached = AIInsight(creator_id=creator_id, insight_type="growth_simulation")
            db.add(cached)
        cached.content = parsed
        db.commit()

        return parsed
