import json
from uuid import uuid4
from sqlalchemy.orm import Session
from app.models.fact_record import FactRecord
from app.models.campaign import CampaignStrategy
from app.schemas.campaign import CampaignCreate
from app.integrations.gemini_client import GeminiClient

class CampaignService:
    def __init__(self, db: Session):
        self.db = db
        self.gemini = GeminiClient()

    def generate_campaign(self, enterprise_id: str, goal: str) -> CampaignStrategy:
        # 1. Read the facts (Single-source truth ingested from connected docs)
        facts = self.db.query(FactRecord).filter(
            FactRecord.enterprise_id == enterprise_id,
            FactRecord.is_stale == False
        ).all()

        fact_summaries = []
        for f in facts:
            fact_summaries.append(f"- {f.category} ({f.key}): {f.value}")
        
        facts_context = "\n".join(fact_summaries) if fact_summaries else "No specific facts available from Vault."

        # 2. Query Gemini for the Campaign Strategy
        prompt = f"""
You are the elite Enterprise Campaign Strategist AI running inside Enflomnia's Content Nervous System.
Your job is to read the verified facts from the company's Knowledge Lake and design an optimized social media campaign based on the given goal.

ENTERPRISE GOAL: {goal}

ENTERPRISE KNOWLEDGE/FACTS (DO NOT HALLUCINATE FEATURES OUTSIDE OF THESE FACTS):
{facts_context}

INSTRUCTIONS:
Design a highly engaging, converting social media campaign strategy. Outline a timeline of scripts to post, potential comments users might leave and how to reply, and a brief reach/growth forecast.
CRITICAL: For each day/script, you must write the EXACT prompt that will be fed into our Image Studio (Gemini 3) and Video Studio (Remotion Engine) to automatically generate the assets for that day.

Respond EXACTLY in the following JSON format without Markdown formatting or backticks:
{{
  "title": "A catchy campaign title",
  "reach_forecast": "A 1-2 sentence prediction of growth based on the strategy.",
  "proposed_scripts": [
    {{
      "day": "e.g. Day 1: Teaser",
      "format": "Reels / TikTok",
      "topic": "What the video is about",
      "rationale": "Why this works",
      "hook": "The first 3 seconds",
      "body_points": ["Point 1", "Point 2"],
      "call_to_action": "The CTA",
      "image_prompt": "Highly detailed midjourney-style prompt for the hero image of this post. Include lighting, mood, subject, and brand colors.",
      "video_prompt": "Direct instructions for the Video Engine: e.g., 'Fast-paced editing, bold text overlays, cinematic b-roll of X'."
    }}
  ],
  "engagement_playbook": [
    {{
      "anticipated_comment": "User comment you expect",
      "suggested_reply": "Brand reply",
      "tone": "e.g. Helpful / Witty"
    }}
  ]
}}
"""

        try:
            parsed = self.gemini.invoke_model_json(prompt, agent_name="campaign_strategist")
            if not isinstance(parsed, dict) or "title" not in parsed:
                raise ValueError("Parsed JSON does not match expected structure.")

        except Exception as e:
            # Fallback mock data if API limits or parsing errors
            print("Error generating campaign, using fallback:", e)
            parsed = {
                "title": f"Campaign strategy for {goal}",
                "reach_forecast": "Expected to boost engagement by 20% over 2 weeks.",
                "proposed_scripts": [{"day": "Day 1", "format": "Reel", "topic": goal, "rationale": "Direct", "hook": "Wait, what?", "body_points": ["Detail A"], "call_to_action": "Follow us", "image_prompt": "Cinematic shot of a product launch, studio lighting, highly detailed.", "video_prompt": "Up-tempo reel with bold captions."}],
                "engagement_playbook": [{"anticipated_comment": "Is this real?", "suggested_reply": "Yes it is!", "tone": "Friendly"}]
            }

        # 3. Store the Campaign in the DB
        campaign = CampaignStrategy(
            id=str(uuid4()),
            enterprise_id=enterprise_id,
            goal=goal,
            title=parsed.get("title", f"Campaign for {goal}"),
            proposed_scripts=parsed.get("proposed_scripts", []),
            engagement_playbook=parsed.get("engagement_playbook", []),
            reach_forecast=parsed.get("reach_forecast", "")
        )

        self.db.add(campaign)
        self.db.commit()
        self.db.refresh(campaign)

        return campaign

    def list_campaigns(self, enterprise_id: str):
        return self.db.query(CampaignStrategy).filter(
            CampaignStrategy.enterprise_id == enterprise_id
        ).order_by(CampaignStrategy.created_at.desc()).all()
