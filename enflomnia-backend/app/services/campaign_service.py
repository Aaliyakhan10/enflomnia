"""
Campaign Service — Strategic content architecture and AI-driven persona discovery.
Follows CODING_STANDARDS.md: Clean Logic, Minimal Method-level Imports.
"""
import json
import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.fact_record import FactRecord
from app.models.campaign import CampaignStrategy
from app.models.enterprise import Enterprise
from app.schemas.campaign import CampaignCreate
from app.integrations.gemini_client import GeminiClient
from app.services.knowledge_lake import KnowledgeLakeService

class CampaignService:
    def __init__(self, db: Session):
        self.db = db
        self.gemini = GeminiClient()
        self.knowledge_lake = KnowledgeLakeService()

    def generate_campaign(self, enterprise_id: str, goal: str, user_email: str = None) -> CampaignStrategy:
        """Architects a multi-day social media campaign strategy grounded in facts."""
        
        # 1. Context Aggregation
        knowledge_context = self.knowledge_lake.get_context_for_agent(self.db, enterprise_id, goal)
        facts = self.db.query(FactRecord).filter(
            FactRecord.enterprise_id == enterprise_id,
            FactRecord.is_stale == False
        ).all()

        fact_summaries = [f"- {f.category} ({f.key}): {f.value}" for f in facts]
        facts_context = "\n".join(fact_summaries) if fact_summaries else "No specific facts available from Vault."

        # 2. Strategy Synthesis
        prompt = f"""
You are the elite Enterprise Campaign Strategist AI running inside Enflomnia's Content Nervous System.
Your job is to read the verified facts from the company's Knowledge Lake and design an optimized social media campaign based on the given goal.

ENTERPRISE GOAL: {goal}

ENTERPRISE KNOWLEDGE LAKE (RELEVANT DOCUMENTS):
{knowledge_context if knowledge_context else "No specific documents found."}

ENTERPRISE FACTS (DO NOT HALLUCINATE FEATURES OUTSIDE OF THESE FACTS):
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
            # Resilient Fallback
            parsed = self._get_fallback_campaign(goal)

        # 3. Persistence
        campaign = CampaignStrategy(
            id=str(uuid.uuid4()),
            enterprise_id=enterprise_id,
            user_email=user_email,
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

    def list_campaigns(self, enterprise_id: str = None, user_email: str = None) -> List[CampaignStrategy]:
        """Lists historical campaigns for an enterprise or user."""
        query = self.db.query(CampaignStrategy)
        if user_email:
            query = query.filter(CampaignStrategy.user_email == user_email)
        elif enterprise_id:
            query = query.filter(CampaignStrategy.enterprise_id == enterprise_id)
        return query.order_by(CampaignStrategy.created_at.desc()).all()

    def suggest_objectives(self, enterprise_id: str) -> List[Dict[str, str]]:
        """Analyze enterprise documents and facts to suggest 3 campaign objectives."""
        enterprise = self.db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
        if not enterprise:
            raise HTTPException(status_code=404, detail="Enterprise not found")

        # Broad context discovery
        context = self.knowledge_lake.get_context_for_agent(self.db, enterprise_id, "mission products values strategy")
        
        ent_info = f"Enterprise: {enterprise.name}\nIndustry: {enterprise.industry}\nProduct: {enterprise.primary_product}"

        prompt = f"""
        You are the Enflomnia Strategy Architect. Based on the following enterprise context, suggest 3 distinct, high-impact social media campaign objectives.
        
        ENTERPRISE INFO:
        {ent_info}
        
        KNOWLEDGE LAKE CONTEXT:
        {context if context else "No specific documents found."}
        
        Return EXACTLY a JSON array of objects with: "title", "objective", "rationale".
        """
        
        try:
            suggestions = self.gemini.invoke_model_json(prompt, agent_name="strategy_architect")
            if not isinstance(suggestions, list):
                suggestions = suggestions.get("suggestions", [])
            return suggestions[:3]
        except Exception:
            return self._get_fallback_objectives(enterprise)

    def magic_scan_persona(self, enterprise_id: str) -> Dict[str, str]:
        """Scans Knowledge Lake to automatically derive the Enterprise Persona."""
        enterprise = self.db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
        if not enterprise:
            raise HTTPException(status_code=404, detail="Enterprise not found")
        
        context = self.knowledge_lake.get_context_for_agent(self.db, enterprise_id, "branding identity mission")
        
        prompt = f"""
        You are the Enflomnia Persona Architect. Extract the company 'DNA' from their Knowledge Lake.
        
        KNOWLEDGE LAKE DOCUMENTS:
        {context if context else "No documentation found. Use the company name as a baseline."}
        
        COMPANY NAME: {enterprise.name}
        INDUSTRY: {enterprise.industry}
        
        Return EXACTLY a JSON object with:
        - "primary_product": 1-2 sentence description.
        - "target_audience": Ideal customer profile.
        - "brand_voice": 3-5 adjectives or tone description.
        - "main_objectives": Top 2-3 goals.
        """
        
        try:
            return self.gemini.invoke_model_json(prompt, agent_name="persona_architect")
        except Exception:
            return self._get_fallback_persona(enterprise)

    # ── Internal Fallbacks ───────────────────────────────────────────────────

    def _get_fallback_campaign(self, goal: str) -> dict:
        return {
            "title": f"Strategic Initiative: {goal}",
            "reach_forecast": "Moderate growth anticipated (15-20% reach increase).",
            "proposed_scripts": [{
                "day": "Day 1", "format": "Reel", "topic": goal, "rationale": "Direct engagement", 
                "hook": "Ever wondered how to scale?", "body_points": ["Highlighting core values"], 
                "call_to_action": "Check the link in bio", 
                "image_prompt": "Sleek, modern office setting with professional lighting.", 
                "video_prompt": "Fast cuts, upbeat music, professional overlays."
            }],
            "engagement_playbook": [{"anticipated_comment": "Interesting!", "suggested_reply": "Thanks! We're excited too.", "tone": "Professional"}]
        }

    def _get_fallback_objectives(self, enterprise: Enterprise) -> list:
        return [
            {"title": "Global Brand Awareness", "objective": f"Introduce {enterprise.name} to new markets.", "rationale": "Visibility focus."},
            {"title": "Product Feature Spotlight", "objective": "Highlight your core competitive advantage.", "rationale": "Conversion focus."}
        ]

    def _get_fallback_persona(self, enterprise: Enterprise) -> dict:
        return {
            "primary_product": f"High-quality solutions in {enterprise.industry}.",
            "target_audience": "Modern enterprises and visionary individuals.",
            "brand_voice": "Professional, Reliable, Innovating",
            "main_objectives": "Enhance digital footprint and drive brand trust."
        }
