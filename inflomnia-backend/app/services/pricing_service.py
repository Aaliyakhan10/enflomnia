"""
Pricing Service — Brand Deal Pricing
Estimates fair price ranges for creator × brand deals using:
1. CPM formula with platform/niche multipliers
2. OpenSearch RAG (similar creator deal history)
3. Claude 3.5 Sonnet for validation and reasoning
"""
import json
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.integrations.gemini_client import GeminiClient
from app.integrations.opensearch_client import OpenSearchClient
from app.integrations.s3_client import S3Client
from app.models.brand import BrandDeal

# ── Pricing constants ────────────────────────────────────────────────────────

# Base CPM (cost per 1,000 followers) per platform in USD
PLATFORM_BASE_CPM = {
    "instagram": 0.012,
    "youtube":   0.020,
    "tiktok":    0.008,
}

# Deliverable type multiplier
DELIVERABLE_MULTIPLIER = {
    "post":  1.0,
    "story": 0.4,
    "reel":  1.5,
    "video": 2.5,  # YouTube long-form
}

# Niche premium multiplier
NICHE_PREMIUM = {
    "finance":    2.5,
    "tech":       2.2,
    "fitness":    1.8,
    "beauty":     1.7,
    "fashion":    1.6,
    "food":       1.4,
    "travel":     1.4,
    "gaming":     1.3,
    "lifestyle":  1.2,
    "education":  1.5,
    "general":    1.0,
}


class PricingService:

    def __init__(self):
        self.bedrock = GeminiClient()
        self.opensearch = OpenSearchClient()
        self.s3 = S3Client()

    # ── Public API ──────────────────────────────────────────────────────────

    def estimate_price(
        self,
        db: Session,
        creator_id: str,
        platform: str,
        deliverable_type: str,
        follower_count: int,
        engagement_rate: float,
        niche: str,
        brand_name: Optional[str] = None,
        brand_industry: Optional[str] = None,
        offered_price: Optional[float] = None,
    ) -> dict:
        # ── 0. Check Cache ──
        existing = db.query(BrandDeal).filter(
            BrandDeal.creator_id == creator_id,
            BrandDeal.platform == platform,
            BrandDeal.deliverable_type == deliverable_type,
            BrandDeal.follower_count == follower_count,
            BrandDeal.niche == niche,
            BrandDeal.brand_name == brand_name
        ).order_by(BrandDeal.created_at.desc()).first()
        
        if existing:
            delta = datetime.now() - existing.created_at
            if delta.total_seconds() < 24 * 3600:
                # Reuse existing reasoning and prices
                return {
                    "creator_id": creator_id,
                    "platform": platform,
                    "deliverable_type": deliverable_type,
                    "suggested_price_min": existing.suggested_price_min,
                    "suggested_price_max": existing.suggested_price_max,
                    "recommended_price": existing.recommended_price,
                    "offered_price": offered_price,
                    "deal_verdict": self._get_verdict(offered_price, existing.suggested_price_min, existing.suggested_price_max),
                    "reasoning": existing.reasoning,
                    "confidence": existing.confidence,
                    "created_at": existing.created_at,
                    "cached": True
                }

        # 1. Formula-based estimate
        min_p, max_p, rec_p = self._formula_estimate(
            platform, deliverable_type, follower_count, engagement_rate, niche
        )

        # 2. RAG adjustment (similar creator benchmarks via OpenSearch)
        rag_adjustment = self._rag_adjustment(niche, platform, follower_count)
        min_p  *= rag_adjustment
        max_p  *= rag_adjustment
        rec_p  *= rag_adjustment

        # 3. Claude reasoning
        reasoning = self._get_claude_reasoning(
            platform, deliverable_type, follower_count, engagement_rate,
            niche, min_p, max_p, rec_p, offered_price
        )

        # 4. Persist
        deal = BrandDeal(
            id=str(uuid.uuid4()),
            creator_id=creator_id,
            brand_name=brand_name,
            platform=platform,
            deliverable_type=deliverable_type,
            follower_count=follower_count,
            engagement_rate=engagement_rate,
            niche=niche,
            offered_price=offered_price,
            suggested_price_min=round(min_p, 2),
            suggested_price_max=round(max_p, 2),
            recommended_price=round(rec_p, 2),
            reasoning=reasoning,
            confidence=0.75 + (0.1 if rag_adjustment != 1.0 else 0.0),
        )
        db.add(deal)
        db.commit()
        db.refresh(deal)

        # 6. Archive to S3
        self.s3.archive_json(
            data={"creator_id": creator_id, "deal_id": deal.id, "estimate": deal.__dict__},
            prefix=f"pricing/{creator_id}",
        )

        return {
            "creator_id": creator_id,
            "platform": platform,
            "deliverable_type": deliverable_type,
            "suggested_price_min": round(min_p, 2),
            "suggested_price_max": round(max_p, 2),
            "recommended_price": round(rec_p, 2),
            "offered_price": offered_price,
            "deal_verdict": self._get_verdict(offered_price, min_p, max_p),
            "reasoning": reasoning,
            "confidence": deal.confidence,
            "created_at": deal.created_at or datetime.utcnow(),
            "cached": False
        }

    def _get_verdict(self, offered_price: Optional[float], min_p: float, max_p: float) -> Optional[str]:
        if not offered_price:
            return None
        if offered_price < min_p * 0.8:
            return "low"
        elif offered_price < min_p:
            return "below_range"
        elif offered_price <= max_p:
            return "fair"
        else:
            return "great"

    def get_history(self, db: Session, creator_id: str, limit: int = 20) -> dict:
        items = (
            db.query(BrandDeal)
            .filter(BrandDeal.creator_id == creator_id)
            .order_by(BrandDeal.created_at.desc())
            .limit(limit)
            .all()
        )
        return {"items": items, "total": len(items)}

    # ── Private helpers ─────────────────────────────────────────────────────

    def _formula_estimate(
        self, platform: str, deliverable_type: str,
        follower_count: int, engagement_rate: float, niche: str
    ) -> tuple[float, float, float]:
        base_cpm = PLATFORM_BASE_CPM.get(platform, 0.010)
        deliv_mult = DELIVERABLE_MULTIPLIER.get(deliverable_type, 1.0)
        niche_mult = NICHE_PREMIUM.get(niche.lower(), 1.0)

        base = follower_count * base_cpm * deliv_mult
        engagement_bonus = 1 + (engagement_rate * 10)  # 4% ER → +40%

        rec_price = base * niche_mult * engagement_bonus
        min_price = rec_price * 0.65
        max_price = rec_price * 1.6

        return min_price, max_price, rec_price

    def _rag_adjustment(self, niche: str, platform: str, follower_count: int) -> float:
        """Query OpenSearch for similar creator deal data; return price multiplier."""
        try:
            results = self.opensearch.search_similar(
                query_text=f"{niche} {platform} creator sponsored content",
                index="creator-deals",
                top_k=5,
            )
            if results:
                return 1.05  # slight upward adjustment when market data found
        except Exception:
            pass
        return 1.0

    def _get_claude_reasoning(
        self, platform, deliverable_type, follower_count, engagement_rate,
        niche, min_p, max_p, rec_p, offered_price
    ) -> str:
        offer_text = f"\nBrand's offer: ${offered_price:.0f}" if offered_price else ""
        prompt = f"""A creator wants to price a brand deal. Give a 2-sentence explanation of the fair rate.

Creator profile:
- Platform: {platform}
- Deliverable: {deliverable_type}
- Followers: {follower_count:,}
- Engagement rate: {engagement_rate:.1%}
- Niche: {niche}

Calculated price range: ${min_p:.0f}–${max_p:.0f} (recommended ${rec_p:.0f}){offer_text}

Return ONLY the explanation. Be warm, confident, and data-focused."""

        system = "You are a creator economy pricing expert. Keep responses concise, friendly, and actionable."
        return self.bedrock.invoke_model(prompt, system=system, max_tokens=120)
