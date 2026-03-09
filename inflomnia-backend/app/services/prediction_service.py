"""
Content Intelligence & Prediction Service
Handles content suggestions, specific reel feedback, competitor/trend analysis,
and long-term growth simulations using Claude 3.5.
"""
import json
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any

from sqlalchemy.orm import Session

from app.integrations.gemini_client import GeminiClient
from app.models.reel import Reel
from app.models.instagram_account import InstagramAccount
from app.models.ai_insight import AIInsight


class PredictionService:

    def __init__(self):
        self.bedrock = GeminiClient()

    # ── 1. Content Suggestions ──────────────────────────────────────────────

    def generate_content_suggestions(self, db: Session, creator_id: str) -> List[Dict[str, Any]]:
        """Suggests 3 new formats/topics based on recent top-performing reels."""
        # ── Check Cache ──
        cached = db.query(AIInsight).filter(AIInsight.creator_id == creator_id, AIInsight.insight_type == "suggestions").first()
        if cached:
            delta = datetime.now(timezone.utc) - cached.generated_at.replace(tzinfo=timezone.utc)
            if delta < timedelta(hours=24):
                return cached.content

        account = db.query(InstagramAccount).filter(InstagramAccount.creator_id == creator_id).first()
        follower_count = account.followers_count if account else 0
        niche = "general" # Can be updated if we add niche to the IG account model
        
        reels = db.query(Reel).filter(Reel.creator_id == creator_id).all()
        
        # Calculate real ER from reels
        total_reach = sum(r.reach or 0 for r in reels)
        total_interactions = sum(r.total_interactions or 0 for r in reels)
        engagement_rate = (total_interactions / total_reach) if total_reach > 0 else 0
        
        # Get top 5 reels by interaction
        reels.sort(key=lambda x: x.total_interactions or 0, reverse=True)
        top_reels = reels[:5]

        context_str = "\n".join([f"- Captions: '{(r.caption or '')[:50]}...', Reach: {r.reach}, Interactions: {r.total_interactions}" for r in top_reels])
        
        prompt = f"""You are an elite Instagram growth strategist. 
The creator is in the '{niche}' niche with {follower_count} followers.
Their average engagement rate is {engagement_rate:.1%}.

Here are their recent top performing reels:
{context_str}

Based on this data, suggest exactly 3 new specific content formats/topics they should test next to maximize engagement.
Your suggestions must be highly strategic. The hook must use a strong psychological trigger (e.g. curiosity gap, controversy, relatability) and run no longer than 3 seconds. The rationale must explicitly reference their historical data.

For each suggestion, also specify a "preferred_time_type" based on the content's nature:
- "peak": Use for high-impact content that needs maximum traffic.
- "morning": Use for educational or routine content.
- "niche": Use for specific community-focused content.

Return ONLY valid JSON with no markdown formatting. The format must be a list of objects exactly like this:
[
  {{
    "title": "Short title",
    "format": "e.g., POV, Tutorial, VLOG",
    "rationale": "Why this will work, citing specific metrics from their past reels.",
    "hook_idea": "A 1-sentence opening hook (max 15 words) using a strong psychological trigger.",
    "preferred_time_type": "peak" | "morning" | "niche"
  }}
]"""
        result = self.bedrock.invoke_model_json(prompt)
        
        # Update Cache
        if not cached:
            cached = AIInsight(creator_id=creator_id, insight_type="suggestions")
            db.add(cached)
        cached.content = result
        db.commit()
        
        return result

    # ── 2. Reel Feedback ────────────────────────────────────────────────────

    def analyze_reel_feedback(self, db: Session, creator_id: str, reel_id: str) -> Dict[str, str]:
        """Provides actionable feedback for a specific reel's performance."""
        # ── Check Cache ──
        cache_key = f"reel_feedback_{reel_id}"
        cached = db.query(AIInsight).filter(AIInsight.creator_id == creator_id, AIInsight.insight_type == cache_key).first()
        if cached:
            delta = datetime.now(timezone.utc) - cached.generated_at.replace(tzinfo=timezone.utc)
            if delta < timedelta(hours=24):
                return cached.content

        reel = db.query(Reel).filter(Reel.id == reel_id, Reel.creator_id == creator_id).first()
        if not reel:
            return {"error": "Reel not found"}

        prompt = f"""You are a content coach. Give short, punchy feedback on this Instagram Reel's performance.
Caption: {reel.caption}
Reach: {reel.reach}
Plays: {reel.plays}
Likes: {reel.like_count}
Comments: {reel.comments_count}
Saves: {reel.saved}
Watch Time Avg (ms): {reel.avg_watch_time_ms}

Analyze the performance ratios (e.g., Saves vs Likes, Watch Time vs Reach). Give specific, punchy coaching feedback. Focus deeply on retention and conversion rather than vanity metrics.
Return ONLY valid JSON:
{{
  "what_worked": "1 sentence on a structural or content strength (e.g., high save-to-like ratio indicates strong educational value)",
  "what_to_improve": "1 sentence on a specific weakness (e.g., low watch time indicates a weak hook or slow pacing)",
  "next_iteration": "1 highly specific, actionable editing or scripting idea to test in the next video to fix the weakness"
}}"""
        result = self.bedrock.invoke_model_json(prompt)

        # Update Cache
        if not cached:
            cached = AIInsight(creator_id=creator_id, insight_type=cache_key)
            db.add(cached)
        cached.content = result
        db.commit()

        return result

    # ── 3. Competitors & Trends ─────────────────────────────────────────────

    def find_competitors_and_trends(self, db: Session, creator_id: str, niche: str) -> Dict[str, Any]:
        """Simulates finding competitors and identifying emerging trends."""
        # ── Check Cache ──
        cache_key = f"trends_{niche}"
        cached = db.query(AIInsight).filter(AIInsight.creator_id == creator_id, AIInsight.insight_type == cache_key).first()
        if cached:
            delta = datetime.now(timezone.utc) - cached.generated_at.replace(tzinfo=timezone.utc)
            if delta < timedelta(hours=24):
                return cached.content

        account = db.query(InstagramAccount).filter(InstagramAccount.creator_id == creator_id).first()
        follower_count = account.followers_count if account else 0
        
        # In a real app, this queries OpenSearch. 
        # Here we mock the outcome via Claude to simulate the intelligence layer.
        
        prompt = f"""You are an Instagram trends analyst. 
The creator is in the '{niche}' niche with {follower_count} followers.

Identify exactly 2 emerging content trends in the '{niche}' space that haven't hit mainstream saturation yet.
Provide a highly actionable description for how the creator can immediately capitalize on this trend in their next video.
Also invent 2 realistic 'mock' competitor handles of a similar size that they should study.

Return ONLY valid JSON:
{{
  "competitors_to_watch": ["@competitor_one", "@competitor_two"],
  "emerging_trends": [
    {{"trend_name": "Trend 1", "description": "Actionable explanation of how to execute this trend right now."}},
    {{"trend_name": "Trend 2", "description": "Actionable explanation of how to execute this trend right now."}}
  ]
}}"""
        result = self.bedrock.invoke_model_json(prompt)

        # Update Cache
        if not cached:
            cached = AIInsight(creator_id=creator_id, insight_type=cache_key)
            db.add(cached)
        cached.content = result
        db.commit()

        return result

    # ── 4. Growth Simulation ────────────────────────────────────────────────

    def simulate_growth(self, db: Session, creator_id: str) -> Dict[str, Any]:
        """Projects 3, 6, and 12-month follower/reach trajectories & pivot strategies."""
        # ── Check Cache ──
        cached = db.query(AIInsight).filter(AIInsight.creator_id == creator_id, AIInsight.insight_type == "growth_simulation").first()
        if cached:
            delta = datetime.now(timezone.utc) - cached.generated_at.replace(tzinfo=timezone.utc)
            if delta < timedelta(hours=24):
                return cached.content

        account = db.query(InstagramAccount).filter(InstagramAccount.creator_id == creator_id).first()
        current_followers = account.followers_count if account else 0
        niche = "general"
        
        reels = db.query(Reel).filter(Reel.creator_id == creator_id).all()
        total_reach = sum(r.reach or 0 for r in reels)
        total_interactions = sum(r.total_interactions or 0 for r in reels)
        engagement_rate = (total_interactions / total_reach) if total_reach > 0 else 0
        
        prompt = f"""You are a predictive data modeler for social media.
The creator has {current_followers} followers, {engagement_rate:.1%} engagement in the '{niche}' niche.

Provide a conservative but realistic 3, 6, and 12-month growth projection based on compound growth.
Also provide 1 multi-stage strategic pivot recommendation to hit or exceed these numbers (e.g., what to do now vs what to do in 6 months).

Return ONLY valid JSON:
{{
  "projections": [
    {{"month": 3, "projected_followers": 0}},
    {{"month": 6, "projected_followers": 0}},
    {{"month": 12, "projected_followers": 0}}
  ],
  "strategic_pivot": "2-sentence strategic recommendation, detailing a multi-stage approach."
}}"""
        parsed = self.bedrock.invoke_model_json(prompt)
        # Ensure numbers make sense
        if not parsed.get("projections"):
            raise ValueError("No projections returned by model")
        
        # Update Cache
        if not cached:
            cached = AIInsight(creator_id=creator_id, insight_type="growth_simulation")
            db.add(cached)
        cached.content = parsed
        db.commit()

        return parsed

    # ── Helpers ─────────────────────────────────────────────────────────────

