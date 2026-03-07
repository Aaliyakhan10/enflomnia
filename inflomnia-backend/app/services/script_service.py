"""
Script Service — Script & Hook Generator
Uses Claude 3.5 Sonnet to create branded content scripts with:
- Hook (attention-grabbing opening)
- Structured sections (intro, problem, solution, demo, CTA)
- Tips for delivery
"""
import json
import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy.orm import Session

from app.integrations.gemini_client import GeminiClient
from app.models.script import Script


class ScriptService:

    def __init__(self):
        self.bedrock = GeminiClient()

    # ── Public API ──────────────────────────────────────────────────────────

    def generate_script(
        self,
        db: Session,
        creator_id: str,
        topic: str,
        brand_name: Optional[str] = None,
        brand_brief: Optional[str] = None,
        tone: str = "entertaining",
    ) -> dict:
        """Generate a branded content script via Claude."""
        raw = self._call_claude(topic, brand_name, brand_brief, tone)

        script = Script(
            id=str(uuid.uuid4()),
            creator_id=creator_id,
            brand_name=brand_name,
            topic=topic,
            tone=tone,
            hook=raw.get("hook", ""),
            structure=json.dumps(raw.get("structure", [])),
            cta=raw.get("cta", ""),
            tips=json.dumps(raw.get("tips", [])),
            reasoning=raw.get("reasoning", ""),
        )
        db.add(script)
        db.commit()
        db.refresh(script)

        return self._format_output(script)

    def get_history(self, db: Session, creator_id: str, limit: int = 20) -> List[dict]:
        scripts = (
            db.query(Script)
            .filter(Script.creator_id == creator_id)
            .order_by(Script.created_at.desc())
            .limit(limit)
            .all()
        )
        return [self._format_output(s) for s in scripts]

    # ── Private helpers ─────────────────────────────────────────────────────

    def _call_claude(self, topic, brand_name, brand_brief, tone) -> dict:
        brand_section = ""
        if brand_name:
            brand_section = f"\nBrand: {brand_name}"
        if brand_brief:
            brand_section += f"\nBrand brief: {brand_brief}"

        prompt = f"""Create a high-converting branded content script for a social media creator. The script must be optimized for modern short-form attention spans.

Topic: {topic}{brand_section}
Tone: {tone}

Rules:
1. The Hook MUST be under 3 seconds (max 12 words) and instantly create a curiosity gap or relatable pain point.
2. At least one visual pattern interrupt should be suggested in the tips.
3. The brand integration must feel organic, never like a traditional commercial.

Return a JSON object with exactly these keys:
{{
  "hook": "one attention-grabbing opening sentence (max 12 words)",
  "structure": [
    {{"section": "Hook", "content": "...", "duration_seconds": 3, "tips": "Visual/Audio hook tip"}},
    {{"section": "Problem / Relatable Moment", "content": "...", "duration_seconds": 8, "tips": "Pacing tip"}},
    {{"section": "Organic Brand Integration", "content": "...", "duration_seconds": 15, "tips": "How to make the brand feel native"}},
    {{"section": "Demo / Value Add", "content": "...", "duration_seconds": 15, "tips": "Show, don't tell tip"}},
    {{"section": "CTA", "content": "...", "duration_seconds": 5, "tips": "Engagement driver tip"}}
  ],
  "cta": "a clear call-to-action line that drives comments or saves, not just followers",
  "tips": ["tip 1", "tip 2", "tip 3"],
  "reasoning": "one sentence on why this specific psychological structure will retain viewers for this topic"
}}

Return ONLY valid JSON, no markdown."""

        system = "You are an expert branded content scriptwriter for social media creators. Always respond with valid JSON."

        return self.bedrock.invoke_model_json(prompt, system=system)

    def _format_output(self, script: Script) -> dict:
        structure = json.loads(script.structure) if script.structure else []
        tips = json.loads(script.tips) if script.tips else []
        return {
            "id": script.id,
            "creator_id": script.creator_id,
            "brand_name": script.brand_name,
            "topic": script.topic,
            "tone": script.tone,
            "hook": script.hook,
            "structure": structure,
            "cta": script.cta,
            "tips": tips,
            "reasoning": script.reasoning,
            "created_at": script.created_at or datetime.utcnow(),
        }
