"""
Instagram Graph API client.
Fetches account info, media list, and per-reel insights.

All calls require a valid User Access Token from the creator's
connected Instagram Business/Creator account.
"""
import httpx
from typing import Optional

GRAPH_BASE = "https://graph.facebook.com"
GRAPH_V = "v21.0"


class InstagramClient:

    def __init__(self, access_token: str):
        self.token = access_token
        self._client = httpx.Client(timeout=15)

    # ── Account ─────────────────────────────────────────────────────────────

    def get_me(self) -> dict:
        """Return basic account info to verify the token is valid."""
        # The token provided is a Facebook User token. We need to find the connected Instagram Business account.
        r = self._client.get(
            f"{GRAPH_BASE}/{GRAPH_V}/me/accounts",
            params={
                "fields": "instagram_business_account{id,username,name,profile_picture_url,followers_count,media_count}",
                "access_token": self.token,
            },
        )
        r.raise_for_status()
        
        data = r.json().get("data", [])
        for page in data:
            if "instagram_business_account" in page:
                ig_info = page["instagram_business_account"]
                # Map fields to match what DB adapter expects
                return {
                    "id": ig_info.get("id"),
                    "username": ig_info.get("username"),
                    "name": ig_info.get("name"),
                    "profile_picture_url": ig_info.get("profile_picture_url"),
                    "followers_count": ig_info.get("followers_count"),
                    "media_count": ig_info.get("media_count"),
                    "account_type": "BUSINESS"
                }

        raise Exception("No Instagram Professional/Creator account found linked to your Facebook pages. Please make sure your Instagram account is linked to a Facebook Page you manage.")

    # ── Media list ───────────────────────────────────────────────────────────

    def get_reels(self, ig_user_id: str, limit: int = 25) -> list[dict]:
        """Fetch recent media, return only REELS with basic metrics."""
        r = self._client.get(
            f"{GRAPH_BASE}/{GRAPH_V}/{ig_user_id}/media",
            params={
                "fields": (
                    "id,caption,media_type,timestamp,permalink,"
                    "thumbnail_url,media_url,"
                    "like_count,comments_count"
                ),
                "limit": limit,
                "access_token": self.token,
            },
        )
        r.raise_for_status()
        data = r.json().get("data", [])
        return [m for m in data if m.get("media_type") == "REELS" or m.get("media_type") == "VIDEO"]

    # ── Reel insights ────────────────────────────────────────────────────────

    def get_reel_insights(self, media_id: str) -> dict:
        """
        Fetch reach, plays, avg watch time for a single reel.
        Requires the account to be Business/Creator.
        """
        metrics = [
            "reach", "saved",
            "ig_reels_avg_watch_time",
            "ig_reels_video_view_total_time",
            "total_interactions",
        ]
        try:
            r = self._client.get(
                f"{GRAPH_BASE}/{GRAPH_V}/{media_id}/insights",
                params={
                    "metric": ",".join(metrics),
                    "access_token": self.token,
                },
            )
            r.raise_for_status()
            raw = r.json().get("data", [])
            return {item["name"]: item["values"][0]["value"] if item.get("values") else item.get("value", 0) for item in raw}
        except Exception:
            # Insights may not always be available (e.g. personal accounts)
            return {}

    def get_media_comments(self, media_id: str, limit: int = 50) -> list[dict]:
        """Fetch real comments for a given media object (Reel/Post)."""
        r = self._client.get(
            f"{GRAPH_BASE}/{GRAPH_V}/{media_id}/comments",
            params={
                "fields": "id,text,timestamp,username",
                "limit": limit,
                "access_token": self.token,
            },
        )
        r.raise_for_status()
        return r.json().get("data", [])

    def close(self):
        self._client.close()
