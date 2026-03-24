"""
Reach Anomaly Service → System Pulse
Detects whether reach changes are creator-specific or platform-wide.
Uses Gemini 2.5 for reasoning with Langfuse tracing.
"""
import json
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.reach_snapshot import ReachSnapshot
from app.models.reel import Reel
from app.models.creator import Creator
from app.integrations.gemini_client import GeminiClient

AGENT_NAME = "system_pulse"


class ReachAnomalyService:

    DROP_THRESHOLD = 0.20
    PLATFORM_WIDE_RATIO = 0.30

    def __init__(self):
        self.gemini = GeminiClient()

    # ------------------------------------------------------------------ #
    #  Ingestion                                                           #
    # ------------------------------------------------------------------ #

    def ingest_snapshot(
        self, db: Session, creator_id: str, reach: int, impressions: int,
    ) -> ReachSnapshot:
        snapshot = ReachSnapshot(
            creator_id=creator_id, reach=reach, impressions=impressions,
        )
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)
        return snapshot

    def ingest_from_reels(self, db: Session, creator_id: str) -> List[ReachSnapshot]:
        reels = (
            db.query(Reel)
            .filter(Reel.creator_id == creator_id, Reel.published_at.isnot(None))
            .order_by(Reel.published_at.desc())
            .limit(60)
            .all()
        )

        existing_dates = set()
        existing_snapshots = (
            db.query(ReachSnapshot)
            .filter(ReachSnapshot.creator_id == creator_id)
            .all()
        )
        for snap in existing_snapshots:
            if snap.recorded_at:
                existing_dates.add(snap.recorded_at.date())

        created = []
        for reel in reels:
            if not reel.reach or reel.reach <= 0:
                continue
            reel_date = reel.published_at.date() if reel.published_at else None
            if reel_date and reel_date in existing_dates:
                continue

            impressions = reel.plays or reel.reach
            snapshot = ReachSnapshot(
                creator_id=creator_id, reach=reel.reach, impressions=impressions,
            )
            snapshot.recorded_at = reel.published_at
            db.add(snapshot)
            if reel_date:
                existing_dates.add(reel_date)
            created.append(snapshot)

        if created:
            db.commit()
            for s in created:
                db.refresh(s)

        return created

    # ------------------------------------------------------------------ #
    #  Analysis                                                            #
    # ------------------------------------------------------------------ #

    def analyze(self, db: Session, creator_id: str) -> dict:
        reels = (
            db.query(Reel)
            .filter(Reel.creator_id == creator_id)
            .order_by(Reel.published_at.desc())
            .limit(30)
            .all()
        )

        if len(reels) < 2:
            return {"anomaly_type": "none", "confidence": 0.0, "reasoning": "Not enough data yet. Post 2+ reels to see patterns."}

        latest = reels[0].reach or 0
        baseline = self._rolling_baseline(reels[1:8])

        if baseline == 0:
            return {"anomaly_type": "none", "confidence": 0.0, "reasoning": "Baseline still building."}

        drop_pct = (baseline - latest) / baseline

        if drop_pct < self.DROP_THRESHOLD:
            return {
                "anomaly_type": "none",
                "confidence": 1 - drop_pct,
                "reasoning": f"Reach is within normal range. Drop of {drop_pct:.1%} is below threshold.",
            }

        if reels[0].anomaly_reasoning and reels[0].anomaly_type != "none":
            return {
                "anomaly_type": reels[0].anomaly_type,
                "confidence": round(reels[0].anomaly_confidence or min(0.95, drop_pct), 3),
                "drop_percentage": round(drop_pct * 100, 1),
                "baseline_reach": int(baseline),
                "current_reach": latest,
                "reasoning": reels[0].anomaly_reasoning,
            }

        similar_creators = self._get_recent_similar_creators(db, creator_id)
        platform_wide = self._detect_platform_wide(db, similar_creators)

        anomaly_type = "platform_wide" if platform_wide else "creator_specific"
        confidence = min(0.95, drop_pct)

        reasoning = self._get_gemini_reasoning(
            creator_id=creator_id, drop_pct=drop_pct, baseline=baseline,
            latest=latest, anomaly_type=anomaly_type,
            similar_affected=len([c for c in similar_creators if c]),
        )

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
        creator = db.query(Creator).filter(Creator.id == creator_id).first()
        if not creator:
            return []
        similar = (
            db.query(Creator.id)
            .filter(
                Creator.id != creator_id,
                Creator.niche == creator.niche,
                Creator.follower_count.between(
                    creator.follower_count * 0.5, creator.follower_count * 2.0,
                ),
            )
            .limit(10)
            .all()
        )
        return [r.id for r in similar]

    def _detect_platform_wide(self, db: Session, similar_creator_ids: List[str]) -> bool:
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

    def _get_gemini_reasoning(
        self, creator_id: str, drop_pct: float, baseline: float,
        latest: int, anomaly_type: str, similar_affected: int,
    ) -> str:
        prompt = f"""A creator's reach changed significantly. Analyse and explain in 2 sentences, friendly tone.

Data:
- Reach drop: {drop_pct:.1%}
- 7-day baseline: {int(baseline):,} | Current: {latest:,}
- Anomaly type: {anomaly_type}
- Similar creators also affected: {similar_affected}

Return ONLY the explanation, no preamble."""

        system = "You are a supportive creator analytics advisor. Keep responses short, warm, and actionable."
        return self.gemini.invoke_model(prompt, system=system, max_tokens=150, agent_name=AGENT_NAME)
