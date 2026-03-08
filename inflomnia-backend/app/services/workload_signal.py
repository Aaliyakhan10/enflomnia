"""
Workload Signal Engine
Analyses creator engagement patterns and recommends content cadence
adjustments to prevent burnout using Claude 3.5 Sonnet reasoning.
"""
import json
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Optional
from sqlalchemy.orm import Session

from app.models.reel import Reel
from app.models.workload_signal import WorkloadSignal
from app.integrations.gemini_client import GeminiClient
from app.integrations.s3_client import S3Client

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


class WorkloadSignalService:

    def __init__(self):
        self.bedrock = GeminiClient()
        self.s3 = S3Client()

    # ------------------------------------------------------------------ #
    #  Heatmap                                                             #
    # ------------------------------------------------------------------ #

    def compute_heatmap(self, db: Session, creator_id: str, days: int = 30) -> dict:
        """Compute an engagement heatmap based on recent reel data."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        reels = (
            db.query(Reel)
            .filter(Reel.creator_id == creator_id, Reel.published_at >= cutoff)
            .all()
        )

        # Accumulate engagement by day × hour
        matrix = defaultdict(lambda: defaultdict(float))
        counts = defaultdict(lambda: defaultdict(int))

        for r in reels:
            dow = r.published_at.strftime("%A")
            hour = r.published_at.hour
            
            # Simple combined score: like + comments (or total_interactions if available)
            eng = r.total_interactions or ((r.like_count or 0) + (r.comments_count or 0))
            
            # Add to heatmap
            matrix[dow][hour] += eng
            counts[dow][hour] += 1

        # Average and fill
        heatmap = {}
        for day in DAYS:
            heatmap[day] = [
                round(matrix[day][h] / max(counts[day][h], 1), 3)
                for h in range(24)
            ]

        return heatmap

    # ------------------------------------------------------------------ #
    #  Signal Generation                                                   #
    # ------------------------------------------------------------------ #

    def analyze_and_generate(self, db: Session, creator_id: str) -> dict:
        """
        Compute heatmap, derive pattern summary, call Claude for signal,
        persist to DB + S3, and return the signal dict.
        """
        # --- Check Cache (1 hour) ---
        latest = self.get_latest_signal(db, creator_id)
        if latest:
            # Parse the string back to datetime to compare
            # generated_at is stored as str(signal.generated_at) in get_latest_signal
            # Let's re-query to get the actual datetime object for precise comparison
            raw_signal = (
                db.query(WorkloadSignal)
                .filter(WorkloadSignal.creator_id == creator_id)
                .order_by(WorkloadSignal.generated_at.desc())
                .first()
            )
            if raw_signal:
                delta = datetime.utcnow() - raw_signal.generated_at
                if delta.total_seconds() < 3600:
                    return latest

        heatmap = self.compute_heatmap(db, creator_id)
        pattern_summary = self._summarize_patterns(heatmap)

        # Call Claude 
        signal_data = self._generate_claude_signal(pattern_summary)

        # Persist
        signal = WorkloadSignal(
            creator_id=creator_id,
            signal_type=signal_data.get("signal_type", "maintain"),
            recommended_posts_per_week=signal_data.get("recommended_posts_per_week", 4),
            best_days=json.dumps(signal_data.get("best_days", [])),
            reasoning=signal_data.get("reasoning", ""),
        )
        db.add(signal)
        db.commit()
        db.refresh(signal)

        result = {
            "id": signal.id,
            "signal_type": signal.signal_type,
            "recommended_posts_per_week": signal.recommended_posts_per_week,
            "best_days": json.loads(signal.best_days),
            "reasoning": signal.reasoning,
            "generated_at": str(signal.generated_at),
        }

        self.s3.archive_workload_signal(creator_id, result)
        return result

    def get_latest_signal(self, db: Session, creator_id: str) -> Optional[dict]:
        """Return the most recently generated signal for a creator."""
        signal = (
            db.query(WorkloadSignal)
            .filter(WorkloadSignal.creator_id == creator_id)
            .order_by(WorkloadSignal.generated_at.desc())
            .first()
        )
        if not signal:
            return None
        return {
            "id": signal.id,
            "signal_type": signal.signal_type,
            "recommended_posts_per_week": signal.recommended_posts_per_week,
            "best_days": json.loads(signal.best_days or "[]"),
            "reasoning": signal.reasoning,
            "generated_at": str(signal.generated_at),
        }

    def get_best_time_for_day(self, db: Session, creator_id: str, day_name: str) -> int:
        """Find the peak engagement hour for a specific day from the heatmap."""
        heatmap = self.compute_heatmap(db, creator_id)
        day_data = heatmap.get(day_name.capitalize(), [0] * 24)
        
        # Find the index (hour) of the maximum engagement
        peak_hour = day_data.index(max(day_data))
        
        # If no engagement data, default to 18:00 (6 PM)
        if day_data[peak_hour] == 0:
            return 18
            
        return peak_hour

    # ------------------------------------------------------------------ #
    #  Helpers                                                             #
    # ------------------------------------------------------------------ #

    def _summarize_patterns(self, heatmap: dict) -> dict:
        """Derive top days, peak hours, and total engagement signal."""
        day_totals = {day: sum(hours) for day, hours in heatmap.items()}
        ranked_days = sorted(day_totals, key=day_totals.get, reverse=True)
        top_days = ranked_days[:3]

        all_hours = [score for day in heatmap.values() for score in day]
        avg_engagement = sum(all_hours) / max(len(all_hours), 1)

        # Detect overposting: if engagement is declining over recent weeks
        signal_hint = "maintain"
        if avg_engagement < 0.2:
            signal_hint = "reduce"
        elif avg_engagement > 0.6:
            signal_hint = "increase"

        return {
            "top_days": top_days,
            "day_totals": day_totals,
            "avg_engagement": round(avg_engagement, 3),
            "signal_hint": signal_hint,
        }

    def _generate_claude_signal(self, pattern_summary: dict) -> dict:
        """Ask Claude 3.5 to generate the workload signal recommendation."""
        prompt = f"""Analyse this creator's engagement patterns and recommend a posting strategy to maximize reach while preventing creator burnout.

Pattern data:
- Top engagement days: {pattern_summary['top_days']}
- Average engagement score: {pattern_summary['avg_engagement']} (scale 0-1)
- Signal hint from data: {pattern_summary['signal_hint']}
- Day totals: {pattern_summary['day_totals']}

Return ONLY valid JSON with these exact keys:
{{
  "signal_type": "reduce" | "maintain" | "increase",
  "recommended_posts_per_week": <integer 1-14>,
  "best_days": ["Day1", "Day2", "Day3"],
  "reasoning": "<2-3 sentences, friendly, actionable. Explicitly state WHY these days/cadence are recommended based on the supplied data.>"
}}"""

        return self.bedrock.invoke_model_json(prompt)
