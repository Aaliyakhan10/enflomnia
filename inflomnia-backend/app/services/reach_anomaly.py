"""
Reach Anomaly Service
Detects whether creator reach changes are creator-specific or platform-wide.
Uses OpenSearch for cross-creator RAG comparison, Claude 3.5 for reasoning.
"""
import json
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.reach_snapshot import ReachSnapshot
from app.models.reel import Reel
from app.models.creator import Creator
from app.integrations.gemini_client import GeminiClient
from app.integrations.opensearch_client import OpenSearchClient
from app.integrations.s3_client import S3Client


class ReachAnomalyService:

    DROP_THRESHOLD = 0.20          # 20% drop triggers anomaly check
    PLATFORM_WIDE_RATIO = 0.30     # 30%+ of similar creators = platform issue

    def __init__(self):
        self.bedrock = GeminiClient()
        self.opensearch = OpenSearchClient()
        self.s3 = S3Client()

    # ------------------------------------------------------------------ #
    #  Ingestion                                                           #
    # ------------------------------------------------------------------ #

    def ingest_snapshot(
        self,
        db: Session,
        creator_id: str,
        reach: int,
        impressions: int,
    ) -> ReachSnapshot:
        """Persist a reach data point to DB and archive to S3."""
        snapshot = ReachSnapshot(
            creator_id=creator_id,
            reach=reach,
            impressions=impressions,
        )
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)

        # Archive to S3
        self.s3.archive_reach_snapshot(
            creator_id,
            {"reach": reach, "impressions": impressions, "recorded_at": str(snapshot.recorded_at)},
        )
        return snapshot

    # ------------------------------------------------------------------ #
    #  Analysis                                                            #
    # ------------------------------------------------------------------ #

    def analyze(self, db: Session, creator_id: str) -> dict:
        """Analyze reach history to detect anomalies."""
        reels = (
            db.query(Reel)
            .filter(Reel.creator_id == creator_id)
            .order_by(Reel.published_at.desc())
            .limit(30)
            .all()
        )

        if len(reels) < 2:
            return {"anomaly_type": "none", "confidence": 0.0, "reasoning": "Not enough data yet."}

        latest = reels[0].reach or 0
        baseline = self._rolling_baseline(reels[1:8])  # 7-day avg (excluding latest)

        if baseline == 0:
            return {"anomaly_type": "none", "confidence": 0.0, "reasoning": "Baseline unavailable."}

        drop_pct = (baseline - latest) / baseline

        if drop_pct < self.DROP_THRESHOLD:
            return {
                "anomaly_type": "none",
                "confidence": 1 - drop_pct,
                "reasoning": f"Reach is within normal range. Drop of {drop_pct:.1%} is below threshold.",
            }

        # Large drop detected — check if platform-wide
        similar_creators = self._get_recent_similar_creators(db, creator_id)
        platform_wide = self._detect_platform_wide(db, similar_creators)

        anomaly_type = "platform_wide" if platform_wide else "creator_specific"
        confidence = min(0.95, drop_pct)

        # Generate Claude reasoning
        reasoning = self._get_claude_reasoning(
            creator_id=creator_id,
            drop_pct=drop_pct,
            baseline=baseline,
            latest=latest,
            anomaly_type=anomaly_type,
            similar_affected=len([c for c in similar_creators if c]),
        )

        # Persist anomaly result on the latest reel
        reels[0].anomaly_type = anomaly_type
        reels[0].anomaly_confidence = confidence
        reels[0].anomaly_reasoning = reasoning
        db.commit()

        return {
            "anomaly_type": anomaly_type,
            "confidence": round(confidence, 3),
            "drop_percentage": round(drop_pct * 100, 1),
            "baseline_reach": int(baseline),
            "current_reach": latest,
            "reasoning": reasoning,
        }

    # ------------------------------------------------------------------ #
    #  Helpers                                                             #
    # ------------------------------------------------------------------ #

    def _rolling_baseline(self, items: list) -> float:
        if not items:
            return 0.0
        return sum((i.reach or 0) for i in items) / len(items)

    def _get_recent_similar_creators(self, db: Session, creator_id: str) -> List[str]:
        """Get creator IDs from the same niche+follower bracket via DB (fallback if no OpenSearch)."""
        creator = db.query(Creator).filter(Creator.id == creator_id).first()
        if not creator:
            return []

        similar = (
            db.query(Creator.id)
            .filter(
                Creator.id != creator_id,
                Creator.niche == creator.niche,
                Creator.follower_count.between(
                    creator.follower_count * 0.5,
                    creator.follower_count * 2.0,
                ),
            )
            .limit(10)
            .all()
        )
        return [r.id for r in similar]

    def _detect_platform_wide(self, db: Session, similar_creator_ids: List[str]) -> bool:
        """Check if 30%+ of similar creators also experienced drops in the last 48h."""
        if not similar_creator_ids:
            return False

        cutoff = datetime.utcnow() - timedelta(hours=48)
        affected = 0

        for cid in similar_creator_ids:
            reels = (
                db.query(Reel)
                .filter(Reel.creator_id == cid, Reel.published_at >= cutoff)
                .order_by(Reel.published_at.desc())
                .limit(5)
                .all()
            )
            if len(reels) >= 2:
                recent = reels[0].reach or 0
                prev_avg = self._rolling_baseline(reels[1:])
                if prev_avg > 0 and (prev_avg - recent) / prev_avg >= self.DROP_THRESHOLD:
                    affected += 1

        ratio = affected / len(similar_creator_ids)
        return ratio >= self.PLATFORM_WIDE_RATIO

    def _get_claude_reasoning(
        self,
        creator_id: str,
        drop_pct: float,
        baseline: float,
        latest: int,
        anomaly_type: str,
        similar_affected: int,
    ) -> str:
        """Ask Claude 3.5 to generate a friendly, creator-facing explanation."""
        prompt = f"""A creator's reach changed significantly. Analyse and explain in 2 sentences, friendly tone.

Data:
- Reach drop: {drop_pct:.1%}
- 7-day baseline: {int(baseline):,} | Current: {latest:,}
- Anomaly type: {anomaly_type}
- Similar creators also affected: {similar_affected}

Return ONLY the explanation, no preamble."""

        system = "You are a supportive creator analytics advisor. Keep responses short, warm, and actionable."
        return self.bedrock.invoke_model(prompt, system=system, max_tokens=150)
