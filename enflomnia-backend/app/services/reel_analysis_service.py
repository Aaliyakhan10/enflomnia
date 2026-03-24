"""
Reel Analysis Service → Asset Gallery
Connects Instagram, fetches reels, and runs Gemini analysis.
Langfuse-traced.
"""
import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.integrations.instagram_client import InstagramClient
from app.integrations.gemini_client import GeminiClient
from app.models.instagram_account import InstagramAccount
from app.models.reel import Reel
from app.services.mock_data_service import seed_mock_instagram_data

AGENT_NAME = "asset_gallery"


class ReelAnalysisService:

    def __init__(self):
        self.gemini = GeminiClient()

    # ── Connect ─────────────────────────────────────────────────────────────

    def connect_account(self, db: Session, creator_id: str, access_token: str) -> InstagramAccount:
        if access_token.startswith("mock"):
            seed_mock_instagram_data(db, creator_id)
            account = db.query(InstagramAccount).filter(InstagramAccount.creator_id == creator_id).first()
            account.access_token = access_token
            db.commit()
            return account

        client = InstagramClient(access_token)
        me = client.get_me()

        account = db.query(InstagramAccount).filter(InstagramAccount.creator_id == creator_id).first()

        is_upgrading_from_mock = account and account.access_token and account.access_token.startswith("mock")
        if not account:
            account = InstagramAccount(id=str(uuid.uuid4()), creator_id=creator_id)
            db.add(account)
        elif is_upgrading_from_mock:
            db.query(Reel).filter(Reel.creator_id == creator_id).delete()
            try:
                from app.models.reach_snapshot import ReachSnapshot
                db.query(ReachSnapshot).filter(ReachSnapshot.creator_id == creator_id).delete()
            except Exception: pass
            try:
                from app.models.comment import Comment
                db.query(Comment).filter(Comment.creator_id == creator_id).delete()
            except Exception: pass
            account.overall_insights = None
            account.top_performing_pattern = None
            account.recommended_posting_style = None
            account.insights_last_generated_at = None

        account.ig_user_id = me["id"]
        account.username = me.get("username")
        account.name = me.get("name")
        account.profile_picture_url = me.get("profile_picture_url")
        account.followers_count = me.get("followers_count")
        account.media_count = me.get("media_count")
        account.account_type = me.get("account_type")
        account.access_token = access_token
        db.commit()
        db.refresh(account)

        if not access_token.startswith("mock"):
            try:
                self.sync_reels(db, creator_id)
            except Exception as e:
                print(f"[WARNING] Initial sync failed: {e}")

        client.close()
        return account

    def get_account(self, db: Session, creator_id: str) -> Optional[InstagramAccount]:
        return db.query(InstagramAccount).filter(InstagramAccount.creator_id == creator_id).first()

    def disconnect_account(self, db: Session, creator_id: str):
        account = self.get_account(db, creator_id)
        if account:
            db.query(Reel).filter(Reel.creator_id == creator_id).delete()
            db.delete(account)
            db.commit()
        return {"success": True}

    # ── Fetch & sync reels ───────────────────────────────────────────────────

    def sync_reels(self, db: Session, creator_id: str, limit: int = 20) -> list[Reel]:
        account = self._get_account_or_raise(db, creator_id)

        if account.access_token.startswith("mock"):
            seed_mock_instagram_data(db, creator_id)
            account.last_synced_at = datetime.now(timezone.utc)
            db.commit()
            return self.get_reels(db, creator_id)

        client = InstagramClient(account.access_token)
        raw_reels = client.get_reels(account.ig_user_id, limit=limit)
        stored = []
        for r in raw_reels:
            insights = client.get_reel_insights(r["id"])
            reel = db.query(Reel).filter(Reel.ig_media_id == r["id"]).first()
            if not reel:
                reel = Reel(id=str(uuid.uuid4()), creator_id=creator_id, ig_media_id=r["id"])
                db.add(reel)
            reel.permalink = r.get("permalink")
            reel.thumbnail_url = r.get("thumbnail_url")
            reel.caption = r.get("caption", "")
            reel.like_count = r.get("like_count", 0)
            reel.comments_count = r.get("comments_count", 0)
            reel.published_at = _parse_ts(r.get("timestamp"))
            reel.reach = insights.get("reach")
            reel.plays = insights.get("plays")
            reel.saved = insights.get("saved")
            reel.total_interactions = insights.get("total_interactions")
            reel.avg_watch_time_ms = insights.get("ig_reels_avg_watch_time")
            reel.total_watch_time_ms = insights.get("ig_reels_video_view_total_time")
            stored.append(reel)

        account.last_synced_at = datetime.now(timezone.utc)
        db.commit()
        for r in stored:
            db.refresh(r)
        client.close()
        return stored

    def get_reels(self, db: Session, creator_id: str) -> list[Reel]:
        return (
            db.query(Reel)
            .filter(Reel.creator_id == creator_id)
            .order_by(Reel.published_at.desc())
            .all()
        )

    # ── Gemini analysis ──────────────────────────────────────────────────────

    def analyze_reels(self, db: Session, creator_id: str) -> dict:
        account = self._get_account_or_raise(db, creator_id)

        if account.insights_last_generated_at:
            delta = datetime.now(timezone.utc) - account.insights_last_generated_at.replace(tzinfo=timezone.utc)
            if delta < timedelta(hours=24):
                reels = self.get_reels(db, creator_id)
                top_reels = sorted(reels, key=lambda r: (r.like_count or 0) + (r.comments_count or 0), reverse=True)[:10]
                return {
                    "account": account, "reels": top_reels,
                    "overall_insights": account.overall_insights,
                    "top_performing": account.top_performing_pattern,
                    "recommended_posting_style": account.recommended_posting_style,
                    "cached": True
                }

        reels = self.get_reels(db, creator_id)
        if not reels:
            return {"error": "No reels found. Sync first."}

        top_reels = sorted(reels, key=lambda r: (r.like_count or 0) + (r.comments_count or 0), reverse=True)[:8]

        reel_summaries = []
        for r in top_reels:
            reel_summaries.append({
                "caption": (r.caption or "")[:60],
                "likes": r.like_count, "comments": r.comments_count,
                "reach": r.reach, "plays": r.plays, "saved": r.saved,
                "watch_time": round(r.avg_watch_time_ms / 1000, 1) if r.avg_watch_time_ms else 0,
            })

        prompt = f"""Analyze these {len(reel_summaries)} Reels for @{account.username}:
{json.dumps(reel_summaries)}

Return JSON:
{{
  "overall_insights": "2-sentence summary. Cite 1 metric.",
  "top_performing_pattern": "1 common trait of top reels.",
  "recommended_posting_style": "Actionable hook, pacing, CTA tips.",
  "reel_scores": [
    {{"index": 0, "hook_quality": 8.5, "analysis": "One-sentence critique (<15 words)."}}
  ]
}}
Be ultra-concise. Return ONLY valid JSON."""

        result = self.gemini.invoke_model_json(prompt, agent_name=AGENT_NAME)

        scores = result.get("reel_scores", [])
        for s in scores:
            idx = s.get("index", -1)
            if 0 <= idx < len(top_reels):
                reel = top_reels[idx]
                reel.hook_quality_score = s.get("hook_quality")
                reel.analysis_summary = s.get("analysis")

        def _to_str(val):
            if isinstance(val, (dict, list)):
                return json.dumps(val)
            return str(val) if val is not None else ""

        account.overall_insights = _to_str(result.get("overall_insights"))
        account.top_performing_pattern = _to_str(result.get("top_performing_pattern"))
        account.recommended_posting_style = _to_str(result.get("recommended_posting_style"))
        account.insights_last_generated_at = datetime.now(timezone.utc)

        db.commit()

        return {
            "account": account, "reels": top_reels,
            "overall_insights": account.overall_insights,
            "top_performing": account.top_performing_pattern,
            "recommended_posting_style": account.recommended_posting_style,
            "cached": False
        }

    def _get_account_or_raise(self, db: Session, creator_id: str) -> InstagramAccount:
        account = db.query(InstagramAccount).filter(
            InstagramAccount.creator_id == creator_id
        ).first()
        if not account:
            raise ValueError(f"No Instagram account connected for creator '{creator_id}'. Connect first.")
        return account


def _parse_ts(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except Exception:
        return None
