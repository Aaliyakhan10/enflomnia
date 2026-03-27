"""
Workload Signal Engine → The Pulse
Analyses engagement patterns and recommends content cadence
using Gemini 2.5 reasoning with Langfuse tracing.
"""
import json
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Optional
from sqlalchemy.orm import Session

from app.models.reel import Reel
from app.models.workload_signal import WorkloadSignal
from app.integrations.gemini_client import GeminiClient
from app.services.knowledge_lake import KnowledgeLakeService

AGENT_NAME = "pulse"
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


class WorkloadSignalService:

    def __init__(self):
        self.gemini = GeminiClient()
        self.knowledge_svc = KnowledgeLakeService()

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

        matrix = {}
        counts = {}

        for r in reels:
            dow = str(r.published_at.strftime("%A"))
            hour = int(r.published_at.hour)
            eng_val = r.total_interactions or ((r.like_count or 0) + (r.comments_count or 0))
            if eng_val is None:
                eng_val = 0
            eng = float(eng_val)

            if dow not in matrix:
                matrix[dow] = {}
                counts[dow] = {}
            if hour not in matrix[dow]:
                matrix[dow][hour] = 0.0
                counts[dow][hour] = 0

            matrix[dow][hour] = matrix[dow][hour] + eng
            counts[dow][hour] = counts[dow][hour] + 1

        heatmap = {}
        for day in DAYS:
            heatmap[day] = []
            for h in range(24):
                c = counts.get(day, {}).get(h, 0)
                m = matrix.get(day, {}).get(h, 0.0)
                heatmap[day].append(round(m / max(c, 1), 3))  # type: ignore

        return heatmap

    # ------------------------------------------------------------------ #
    #  Signal Generation                                                   #
    # ------------------------------------------------------------------ #

    def analyze_and_generate(self, db: Session, creator_id: str) -> dict:
        """Compute heatmap, derive patterns, call Gemini for signal."""
        latest = self.get_latest_signal(db, creator_id)
        if latest:
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

        # Fetch global context
        context = self.knowledge_svc.get_context_for_agent(db, creator_id, "posting strategy")

        signal_data = self._generate_signal(pattern_summary, context)

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

        return {
            "id": signal.id,
            "signal_type": signal.signal_type,
            "recommended_posts_per_week": signal.recommended_posts_per_week,
            "best_days": json.loads(signal.best_days),
            "reasoning": signal.reasoning,
            "generated_at": str(signal.generated_at),
        }

    def get_latest_signal(self, db: Session, creator_id: str) -> Optional[dict]:
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
        heatmap = self.compute_heatmap(db, creator_id)
        day_data = heatmap.get(day_name.capitalize(), [0] * 24)
        peak_hour = day_data.index(max(day_data))
        if day_data[peak_hour] == 0:
            return 18
        return peak_hour

    def get_slot_score(self, db: Session, creator_id: str, day_name: str, hour: int) -> float:
        heatmap = self.compute_heatmap(db, creator_id)
        day_data = heatmap.get(day_name.capitalize(), [0] * 24)
        return day_data[hour] if 0 <= hour < 24 else 0.0

    # ------------------------------------------------------------------ #
    #  Helpers                                                             #
    # ------------------------------------------------------------------ #

    def _summarize_patterns(self, heatmap: dict) -> dict:
        day_totals = {day: sum(hours) for day, hours in heatmap.items()}
        ranked_days = sorted(list(day_totals.keys()), key=lambda k: day_totals[k], reverse=True)
        top_days = [ranked_days[i] for i in range(min(3, len(ranked_days)))]

        all_hours = [score for day in heatmap.values() for score in day]
        avg_engagement = sum(all_hours) / max(len(all_hours), 1)

        signal_hint = "maintain"
        if avg_engagement < 0.2:
            signal_hint = "reduce"
        elif avg_engagement > 0.6:
            signal_hint = "increase"

        return {
            "top_days": top_days,
            "day_totals": day_totals,
            "avg_engagement": round(float(avg_engagement), 3),  # type: ignore
            "signal_hint": signal_hint,
        }

    def _generate_signal(self, pattern_summary: dict, context: Optional[str] = None) -> dict:
        """Ask Gemini to generate the workload signal recommendation."""
        context_block = f"\n\nContext from Knowledge Lake:\n{context}" if context else ""
        
        prompt = f"""Analyse this creator's engagement patterns and recommend a posting strategy to maximize reach while preventing creator burnout.
{context_block}

Pattern data:
- Top engagement days: {pattern_summary['top_days']}
- Average engagement score: {pattern_summary['avg_engagement']} (scale 0-1)
- Signal hint from data: {pattern_summary['signal_hint']}
- Day totals: {pattern_summary['day_totals']}

Return ONLY valid JSON with these exact keys:
{
  "signal_type": "reduce" | "maintain" | "increase",
  "recommended_posts_per_week": <integer 1-14>,
  "best_days": ["Day1", "Day2", "Day3"],
  "reasoning": "<2-3 sentences, friendly, actionable. Explicitly state WHY these days/cadence are recommended based on the supplied data.>"
}"""

        return self.gemini.invoke_model_json(prompt, agent_name=AGENT_NAME)
