"""
Workload Signal Engine
Analyses creator engagement patterns and recommends content cadence
adjustments to prevent burnout using Claude 3.5 Sonnet reasoning.
"""
import json
from datetime import datetime, timedelta
from collections import defaultdict
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.models.reach_snapshot import ReachSnapshot
from app.models.workload_signal import WorkloadSignal
from app.integrations.bedrock_client import BedrockClient
from app.integrations.s3_client import S3Client

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


class WorkloadSignalService:

    def __init__(self):
        self.bedrock = BedrockClient()
        self.s3 = S3Client()

    # ------------------------------------------------------------------ #
    #  Heatmap                                                             #
    # ------------------------------------------------------------------ #

    def compute_heatmap(self, db: Session, creator_id: str, days: int = 30) -> dict:
        """
        Build a day-of-week × hour engagement heatmap from the last N days.
        Returns a dict: { "Monday": [score_h0..score_h23], ... }
        """
        cutoff = datetime.utcnow() - timedelta(days=days)
        comments = (
            db.query(Comment)
            .filter(Comment.creator_id == creator_id, Comment.timestamp >= cutoff)
            .all()
        )
        reach_snaps = (
            db.query(ReachSnapshot)
            .filter(ReachSnapshot.creator_id == creator_id, ReachSnapshot.recorded_at >= cutoff)
            .all()
        )

        # Accumulate engagement by day × hour
        matrix = defaultdict(lambda: defaultdict(float))
        counts = defaultdict(lambda: defaultdict(int))

        for c in comments:
            dow = c.timestamp.strftime("%A")
            hour = c.timestamp.hour
            matrix[dow][hour] += c.engagement_score or 0.5
            counts[dow][hour] += 1

        for s in reach_snaps:
            dow = s.recorded_at.strftime("%A")
            hour = s.recorded_at.hour
            # Normalise reach to 0-1 against max observed
            max_reach = max((r.reach for r in reach_snaps), default=1)
            matrix[dow][hour] += s.reach / max(max_reach, 1)
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
        heatmap = self.compute_heatmap(db, creator_id)
        pattern_summary = self._summarize_patterns(heatmap)

        # Call Claude 3.5
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

    def get_latest_signal(self, db: Session, creator_id: str) -> dict | None:
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
        try:
            prompt = f"""Analyse this creator's engagement patterns and recommend a posting strategy.

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
  "reasoning": "<2 sentences, friendly, actionable>"
}}"""

            return self.bedrock.invoke_claude_json(prompt)
        except Exception:
            # Fallback: rule-based
            top_days = pattern_summary.get("top_days", ["Monday", "Wednesday", "Friday"])
            hint = pattern_summary.get("signal_hint", "maintain")
            posts = {"reduce": 2, "maintain": 4, "increase": 6}.get(hint, 4)
            return {
                "signal_type": hint,
                "recommended_posts_per_week": posts,
                "best_days": top_days,
                "reasoning": f"Based on your engagement data, posting {posts}x/week on your top days will optimise reach. Focus on {', '.join(top_days[:2])} for best results.",
            }
