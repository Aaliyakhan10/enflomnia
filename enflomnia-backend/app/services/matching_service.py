"""
Matching Service → The Alchemist / Imagen 4 Studio
Matches creators to brands using Gemini reasoning.
Langfuse-traced.
"""
import json
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.integrations.gemini_client import GeminiClient
from app.models.brand import Brand
from app.models.brand_match import BrandMatch

AGENT_NAME = "alchemist"

NICHE_INDUSTRY_MAP = {
    "fitness":   ["fitness", "health", "food", "wellness", "sports"],
    "beauty":    ["beauty", "fashion", "lifestyle", "wellness"],
    "tech":      ["tech", "gaming", "finance", "education"],
    "gaming":    ["gaming", "tech", "energy", "fashion"],
    "food":      ["food", "travel", "lifestyle", "wellness"],
    "travel":    ["travel", "food", "fashion", "lifestyle"],
    "fashion":   ["fashion", "beauty", "lifestyle", "travel"],
    "finance":   ["finance", "tech", "education"],
    "education": ["education", "tech", "finance"],
    "lifestyle": ["lifestyle", "beauty", "fashion", "food", "travel"],
    "general":   [],
}


class MatchingService:

    def __init__(self):
        self.gemini = GeminiClient()

    def add_brand(self, db: Session, **kwargs) -> Brand:
        brand = Brand(id=str(uuid.uuid4()), **kwargs)
        db.add(brand)
        db.commit()
        db.refresh(brand)
        return brand

    def get_brands(self, db: Session) -> List[Brand]:
        return db.query(Brand).order_by(Brand.created_at.desc()).all()

    def find_matches(
        self, db: Session, creator_id: str, niche: str, platform: str,
        follower_count: int, engagement_rate: float,
        audience_description: Optional[str] = None,
    ) -> List[dict]:
        existing_matches = db.query(BrandMatch).filter(
            BrandMatch.creator_id == creator_id, BrandMatch.status == "pending"
        ).order_by(BrandMatch.created_at.desc()).all()

        if existing_matches:
            delta = datetime.now() - existing_matches[0].created_at
            if delta.total_seconds() < 24 * 3600:
                results = []
                for m in existing_matches:
                    brand = db.query(Brand).filter(Brand.id == m.brand_id).first()
                    results.append({
                        "id": m.id, "brand_id": m.brand_id,
                        "brand_name": brand.name if brand else "Unknown",
                        "brand_industry": brand.industry if brand else "",
                        "relevance_score": m.relevance_score,
                        "niche_match": m.niche_match,
                        "audience_overlap": m.audience_overlap,
                        "fit_reasoning": m.fit_reasoning,
                        "budget_range_min": brand.budget_range_min if brand else None,
                        "budget_range_max": brand.budget_range_max if brand else None,
                        "status": m.status, "created_at": m.created_at, "cached": True
                    })
                return results

        self._seed_mock_brands_if_empty(db)
        self._discover_external_brands(db, niche)

        brands = db.query(Brand).all()
        if not brands:
            return []

        scored = []
        for brand in brands:
            niche_score = self._niche_match_score(niche, brand.industry)
            audience_score = self._audience_overlap_score(
                niche, audience_description, brand.target_audience, brand.content_niches
            )
            budget_score = self._budget_fit_score(follower_count, brand.budget_range_min, brand.budget_range_max)
            overall = round((niche_score * 0.4 + audience_score * 0.35 + budget_score * 0.25), 3)
            scored.append((overall, niche_score, audience_score, brand))

        scored.sort(key=lambda x: x[0], reverse=True)
        top_matches = scored[:6]

        db.query(BrandMatch).filter(
            BrandMatch.creator_id == creator_id, BrandMatch.status == "pending"
        ).delete()

        results = []
        for overall, niche_score, audience_score, brand in top_matches:
            reasoning = self._get_gemini_reasoning(
                creator_niche=niche, platform=platform,
                follower_count=follower_count, engagement_rate=engagement_rate,
                brand_name=brand.name, brand_industry=brand.industry,
                target_audience=brand.target_audience, relevance_score=overall,
            )
            match_id = str(uuid.uuid4())
            match = BrandMatch(
                id=match_id, creator_id=creator_id, brand_id=brand.id,
                relevance_score=overall, niche_match=niche_score,
                audience_overlap=audience_score, fit_reasoning=reasoning,
                status="pending",
            )
            db.add(match)
            results.append({
                "id": match_id, "brand_id": brand.id,
                "brand_name": brand.name, "brand_industry": brand.industry,
                "relevance_score": overall, "niche_match": niche_score,
                "audience_overlap": audience_score, "fit_reasoning": reasoning,
                "budget_range_min": brand.budget_range_min,
                "budget_range_max": brand.budget_range_max,
                "status": "pending", "created_at": datetime.utcnow(),
                "cached": False,
                "is_ai_discovered": brand.is_ai_discovered == "true"
            })

        db.commit()
        return results

    def _discover_external_brands(self, db: Session, niche: str):
        discovered_count = db.query(Brand).filter(Brand.industry == niche, Brand.is_ai_discovered == "true").count()
        if discovered_count >= 3:
            return
        prompt = f"""Brainstorm exactly 3 real-world popular brands that partner with creators in the '{niche}' niche.
Return ONLY valid JSON:
[
  {{
    "name": "Brand Name",
    "industry": "{niche}",
    "target_audience": "Short description",
    "content_niches": "comma, separated, niches",
    "budget_range_min": 1000,
    "budget_range_max": 10000
  }}
]"""
        try:
            new_brands_data = self.gemini.invoke_model_json(prompt, agent_name=AGENT_NAME)
            for b_data in new_brands_data:
                exists = db.query(Brand).filter(Brand.name == b_data["name"]).first()
                if not exists:
                    brand = Brand(
                        id=str(uuid.uuid4()), name=b_data["name"],
                        industry=b_data["industry"],
                        target_audience=b_data["target_audience"],
                        content_niches=b_data["content_niches"],
                        budget_range_min=b_data.get("budget_range_min"),
                        budget_range_max=b_data.get("budget_range_max"),
                        is_ai_discovered="true"
                    )
                    db.add(brand)
            db.commit()
        except:
            pass

    def get_matches(self, db: Session, creator_id: str) -> List[dict]:
        matches = (
            db.query(BrandMatch)
            .filter(BrandMatch.creator_id == creator_id)
            .order_by(BrandMatch.relevance_score.desc())
            .all()
        )
        results = []
        for m in matches:
            brand = db.query(Brand).filter(Brand.id == m.brand_id).first()
            results.append({
                "id": m.id, "brand_id": m.brand_id,
                "brand_name": brand.name if brand else "Unknown",
                "brand_industry": brand.industry if brand else "",
                "relevance_score": m.relevance_score,
                "niche_match": m.niche_match,
                "audience_overlap": m.audience_overlap,
                "fit_reasoning": m.fit_reasoning,
                "budget_range_min": brand.budget_range_min if brand else None,
                "budget_range_max": brand.budget_range_max if brand else None,
                "status": m.status,
                "created_at": m.created_at or datetime.utcnow(),
            })
        return results

    # ── Mock Seeding ────────────────────────────────────────────────────────

    def _seed_mock_brands_if_empty(self, db: Session):
        count = db.query(Brand).count()
        if count > 0:
            return
        mock_brands = [
            {"name": "Lumina Skincare", "industry": "beauty", "target_audience": "18-35 women interested in clean beauty", "content_niches": "beauty,lifestyle", "budget_range_min": 500, "budget_range_max": 2500},
            {"name": "Aero Athletics", "industry": "fitness", "target_audience": "fitness enthusiasts and athletes", "content_niches": "fitness,sports,health", "budget_range_min": 1000, "budget_range_max": 5000},
            {"name": "ByteGear", "industry": "tech", "target_audience": "gamers and pc builders", "content_niches": "gaming,tech", "budget_range_min": 1500, "budget_range_max": 8000},
            {"name": "Nomad Coffees", "industry": "food", "target_audience": "coffee lovers and travelers", "content_niches": "food,travel,lifestyle", "budget_range_min": 300, "budget_range_max": 1500},
            {"name": "FinFlex App", "industry": "finance", "target_audience": "20-40 young professionals", "content_niches": "finance,education", "budget_range_min": 2000, "budget_range_max": 10000},
        ]
        for mb in mock_brands:
            brand = Brand(id=str(uuid.uuid4()), **mb)
            db.add(brand)
        db.commit()

    # ── Scoring helpers ─────────────────────────────────────────────────────

    def _niche_match_score(self, creator_niche: str, brand_industry: str) -> float:
        matching = NICHE_INDUSTRY_MAP.get(creator_niche.lower(), [])
        if not matching:
            return 0.6
        if brand_industry.lower() in matching:
            idx = matching.index(brand_industry.lower())
            return max(0.5, 1.0 - idx * 0.1)
        return 0.2

    def _audience_overlap_score(
        self, niche: str, creator_audience: Optional[str],
        brand_audience: Optional[str], brand_niches: Optional[str]
    ) -> float:
        if not brand_audience and not brand_niches:
            return 0.5
        score = 0.5
        if brand_niches:
            brand_niche_list = [n.strip().lower() for n in brand_niches.split(",")]
            if niche.lower() in brand_niche_list:
                score += 0.3
        if creator_audience and brand_audience:
            ca = set(creator_audience.lower().split())
            ba = set(brand_audience.lower().split())
            overlap = len(ca & ba) / max(len(ba), 1)
            score += min(0.2, overlap * 0.4)
        return min(score, 1.0)

    def _budget_fit_score(
        self, follower_count: int, budget_min: Optional[float], budget_max: Optional[float]
    ) -> float:
        if not budget_min and not budget_max:
            return 0.5
        estimated_rate = follower_count * 0.01
        if budget_max and estimated_rate > budget_max * 1.5:
            return 0.1
        if budget_min and estimated_rate < budget_min * 0.3:
            return 0.4
        return 0.8

    def _get_gemini_reasoning(
        self, creator_niche, platform, follower_count, engagement_rate,
        brand_name, brand_industry, target_audience, relevance_score
    ) -> str:
        prompt = f"""Explain in 2 sentences why this creator–brand match makes sense (or doesn't).

Creator: {creator_niche} creator on {platform}, {follower_count:,} followers, {engagement_rate:.1%} ER
Brand: {brand_name} ({brand_industry}), targets: {target_audience or 'not specified'}
Match score: {relevance_score:.0%}

Be friendly, specific, and data-driven. Return ONLY the 2-sentence explanation."""
        system = "You are a creator-brand partnership specialist."
        return self.gemini.invoke_model(prompt, system=system, max_tokens=100, agent_name=AGENT_NAME)
