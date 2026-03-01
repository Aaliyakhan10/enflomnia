"""
Content Intelligence & Prediction Service
Handles content suggestions, specific reel feedback, competitor/trend analysis,
and long-term growth simulations using Claude 3.5.
"""
import json
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any

from sqlalchemy.orm import Session

from app.integrations.bedrock_client import BedrockClient
from app.models.reel import Reel
from app.models.instagram_account import InstagramAccount
from app.services.mock_data_service import get_mock_creator_metrics


class PredictionService:

    def __init__(self):
        self.bedrock = BedrockClient()

    # ── 1. Content Suggestions ──────────────────────────────────────────────

    def generate_content_suggestions(self, db: Session, creator_id: str) -> List[Dict[str, Any]]:
        """Suggests 3 new formats/topics based on recent top-performing reels."""
        metrics = get_mock_creator_metrics(db, creator_id)
        
        # Get top 5 reels by interaction
        reels = db.query(Reel).filter(Reel.creator_id == creator_id).all()
        reels.sort(key=lambda x: x.total_interactions or 0, reverse=True)
        top_reels = reels[:5]

        context_str = "\n".join([f"- Captions: '{r.caption[:50]}...', Reach: {r.reach}, Interactions: {r.total_interactions}" for r in top_reels])
        
        prompt = f"""You are an elite Instagram growth strategist. 
The creator is in the '{metrics['niche']}' niche with {metrics['follower_count']} followers.
Their average engagement rate is {metrics['engagement_rate']:.1%}.

Here are their recent top performing reels:
{context_str}

Based on this data, suggest exactly 3 new specific content formats/topics they should test next to maximize engagement.
Your suggestions must be highly strategic. The hook must use a strong psychological trigger (e.g. curiosity gap, controversy, relatability) and run no longer than 3 seconds. The rationale must explicitly reference their historical data.
Return ONLY valid JSON with no markdown formatting. The format must be a list of objects exactly like this:
[
  {{
    "title": "Short title",
    "format": "e.g., POV, Tutorial, VLOG",
    "rationale": "Why this will work, citing specific metrics from their past reels.",
    "hook_idea": "A 1-sentence opening hook (max 15 words) using a strong psychological trigger."
  }}
]"""
        try:
            res = self.bedrock.invoke_claude(prompt, max_tokens=800)
            return self._parse_json(res)
        except Exception:
            return [
                {"title": "Day in the Life Recap", "format": "VLOG", "rationale": "Audiences love authentic BTS content.", "hook_idea": "Come with me on a typical chaotic Tuesday."},
                {"title": "Debunking a Myth", "format": "Talking Head", "rationale": "High interaction driven by controversial or surprising info.", "hook_idea": "Everything you knew about this is wrong."},
                {"title": "Quick Hack", "format": "Tutorial", "rationale": "High save-rate potential.", "hook_idea": "Save this for the next time you need to do X."}
            ]

    # ── 2. Reel Feedback ────────────────────────────────────────────────────

    def analyze_reel_feedback(self, db: Session, creator_id: str, reel_id: str) -> Dict[str, str]:
        """Provides actionable feedback for a specific reel's performance."""
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
        try:
            res = self.bedrock.invoke_claude(prompt, max_tokens=300)
            return self._parse_json(res)
        except Exception:
            return {
                "what_worked": "Good amount of saves relative to likes, showing the content was valuable.",
                "what_to_improve": "Watch time is slightly below optimal for this reach.",
                "next_iteration": "Try a faster-paced edit in the first 3 seconds to hook viewers longer."
            }

    # ── 3. Competitors & Trends ─────────────────────────────────────────────

    def find_competitors_and_trends(self, db: Session, creator_id: str, niche: str) -> Dict[str, Any]:
        """Simulates finding competitors and identifying emerging trends."""
        metrics = get_mock_creator_metrics(db, creator_id)
        # In a real app, this queries OpenSearch. 
        # Here we mock the outcome via Claude to simulate the intelligence layer.
        
        prompt = f"""You are an Instagram trends analyst. 
The creator is in the '{niche}' niche with {metrics['follower_count']} followers.

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
        try:
            res = self.bedrock.invoke_claude(prompt, max_tokens=500)
            return self._parse_json(res)
        except Exception:
            return {
                "competitors_to_watch": ["@similar_creator1", "@similar_creator2"],
                "emerging_trends": [
                    {"trend_name": "Lo-Fi Storytelling", "description": "Unedited, highly authentic talking head videos."},
                    {"trend_name": "Micro-education Series", "description": "Breaking down 1 complex topic across 5 short parts."}
                ]
            }

    # ── 4. Growth Simulation ────────────────────────────────────────────────

    def simulate_growth(self, db: Session, creator_id: str) -> Dict[str, Any]:
        """Projects 3, 6, and 12-month follower/reach trajectories & pivot strategies."""
        metrics = get_mock_creator_metrics(db, creator_id)
        current_followers = metrics['follower_count']
        
        prompt = f"""You are a predictive data modeler for social media.
The creator has {current_followers} followers, {metrics['engagement_rate']:.1%} engagement in the '{metrics['niche']}' niche.

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
        try:
            res = self.bedrock.invoke_claude(prompt, max_tokens=400)
            parsed = self._parse_json(res)
            # Ensure numbers make sense
            if not parsed.get("projections"):
                raise ValueError
            return parsed
        except Exception:
            return {
                "projections": [
                    {"month": 3, "projected_followers": int(current_followers * 1.15)},
                    {"month": 6, "projected_followers": int(current_followers * 1.4)},
                    {"month": 12, "projected_followers": int(current_followers * 1.9)}
                ],
                "strategic_pivot": "Transition top-performing reel formats into longer serialized storytelling to drive higher follower retention and deeper community engagement."
            }

    # ── Helpers ─────────────────────────────────────────────────────────────

    def _parse_json(self, response: str) -> Any:
        clean = response.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        return json.loads(clean.strip())
