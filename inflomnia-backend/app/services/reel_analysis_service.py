"""
Reel Analysis Service
1. Connects Instagram account by validating and storing the access token
2. Fetches reels from Graph API
3. Enriches each reel with insights (reach, plays, watch time)
4. Sends reel batch to Claude 3.5 for performance analysis
"""
import json
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.integrations.instagram_client import InstagramClient
from app.integrations.gemini_client import GeminiClient
from app.models.instagram_account import InstagramAccount
from app.models.reel import Reel
from app.services.mock_data_service import seed_mock_instagram_data


class ReelAnalysisService:

    def __init__(self):
        self.bedrock = GeminiClient()

    # ── Connect ─────────────────────────────────────────────────────────────

    def connect_account(self, db: Session, creator_id: str, access_token: str) -> InstagramAccount:
        """Validate token, fetch account info, store/update in DB."""
        if access_token.startswith("mock"):
            seed_mock_instagram_data(db, creator_id)
            account = db.query(InstagramAccount).filter(InstagramAccount.creator_id == creator_id).first()
            account.access_token = access_token
            db.commit()
            return account

        client = InstagramClient(access_token)
        me = client.get_me()

        account = db.query(InstagramAccount).filter(InstagramAccount.creator_id == creator_id).first()
        if not account:
            account = InstagramAccount(id=str(uuid.uuid4()), creator_id=creator_id)
            db.add(account)

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
        """Fetch latest reels + insights from Instagram and upsert into DB."""
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
        seed_mock_instagram_data(db, creator_id)
        return (
            db.query(Reel)
            .filter(Reel.creator_id == creator_id)
            .order_by(Reel.published_at.desc())
            .all()
        )

    # ── Claude analysis ──────────────────────────────────────────────────────

    def analyze_reels(self, db: Session, creator_id: str) -> dict:
        """
        Send top reels to Claude 3.5 for a holistic performance analysis.
        Returns: per-reel scores + overall insights + recommended style.
        Caches results for 24 hours.
        """
        account = self._get_account_or_raise(db, creator_id)
        
        # ── Check Cache ──
        if account.insights_last_generated_at:
            delta = datetime.now(timezone.utc) - account.insights_last_generated_at.replace(tzinfo=timezone.utc)
            if delta < timedelta(hours=24):
                reels = self.get_reels(db, creator_id)
                top_reels = sorted(reels, key=lambda r: (r.like_count or 0) + (r.comments_count or 0), reverse=True)[:10]
                return {
                    "account": account,
                    "reels": top_reels,
                    "overall_insights": account.overall_insights,
                    "top_performing": account.top_performing_pattern,
                    "recommended_posting_style": account.recommended_posting_style,
                    "cached": True
                }

        reels = self.get_reels(db, creator_id)
        if not reels:
            return {"error": "No reels found. Sync first."}

        # Build reel summary for Claude (top 10 by engagement)
        top_reels = sorted(reels, key=lambda r: (r.like_count or 0) + (r.comments_count or 0), reverse=True)[:10]

        reel_summaries = []
        for r in top_reels:
            reel_summaries.append({
                "caption_preview": (r.caption or "")[:120],
                "likes": r.like_count,
                "comments": r.comments_count,
                "reach": r.reach,
                "plays": r.plays,
                "saved": r.saved,
                "avg_watch_time_s": round(r.avg_watch_time_ms / 1000, 1) if r.avg_watch_time_ms else None,
            })

        prompt = f"""You are an elite Instagram growth analyst auditing a creator's Reels performance data.

Creator: @{account.username or creator_id}
Followers: {account.followers_count or "unknown"}

Here are their top {len(reel_summaries)} reels:
{json.dumps(reel_summaries, indent=2)}

Return a JSON object with EXACTLY these keys:
{{
  "overall_insights": "A punchy, 2-3 sentence summary of what's working and what's failing. Quote specific metrics (e.g., watch time vs reach).",
  "top_performing_pattern": "What the absolute best-performing reels have in common structurally (e.g., 3-second hook, fast pacing, specific topic).",
  "recommended_posting_style": "Strict, actionable recommendation for hook style, pacing, and CTA for their next batch of content.",
  "reel_scores": [
    {{"index": 0, "hook_quality": 7.5, "analysis": "Harsh, specific critique of this reel's performance based on the data provided."}}
  ]
}}

Be highly specific, data-driven, and actionable. Avoid generic advice like 'make engaging content'. Return ONLY valid JSON."""

        result = self.bedrock.invoke_model_json(prompt, system="You are a social media analytics expert.")

        # Persist scores back to DB
        scores = result.get("reel_scores", [])
        for s in scores:
            idx = s.get("index", -1)
            if 0 <= idx < len(top_reels):
                reel = top_reels[idx]
                reel.hook_quality_score = s.get("hook_quality")
                reel.analysis_summary = s.get("analysis")

        # Update Account Cache
        account.overall_insights = result.get("overall_insights", "")
        account.top_performing_pattern = result.get("top_performing_pattern", "")
        account.recommended_posting_style = result.get("recommended_posting_style", "")
        account.insights_last_generated_at = datetime.now(timezone.utc)
        
        db.commit()

        return {
            "account": account,
            "reels": top_reels,
            "overall_insights": account.overall_insights,
            "top_performing": account.top_performing_pattern,
            "recommended_posting_style": account.recommended_posting_style,
            "cached": False
        }

    # ── Helpers ──────────────────────────────────────────────────────────────

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
