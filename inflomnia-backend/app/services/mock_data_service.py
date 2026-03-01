import uuid
import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.reel import Reel
from app.models.instagram_account import InstagramAccount


def seed_mock_instagram_data(db: Session, creator_id: str):
    """
    If a creator has no Instagram account/reels connected, automatically
    generate a realistic 'look-alike' dataset so the UI dashboards work.
    """
    # 1. Ensure mock account exists
    account = db.query(InstagramAccount).filter(InstagramAccount.creator_id == creator_id).first()
    if not account:
        account = InstagramAccount(
            id=str(uuid.uuid4()),
            creator_id=creator_id,
            ig_user_id=f"mock_ig_{random.randint(1000, 9999)}",
            username="mock_creator_studio",
            name="Mock Creator",
            profile_picture_url="https://ui-avatars.com/api/?name=Mock+Creator&background=random",
            followers_count=random.randint(15000, 75000),
            media_count=30,
            account_type="BUSINESS",
            access_token="mock_token_123"
        )
        db.add(account)
        db.commit()

    # 2. Check reels
    reels_count = db.query(Reel).filter(Reel.creator_id == creator_id).count()
    if reels_count > 0:
        return  # Already seeded or has real data

    now = datetime.now(timezone.utc)
    base_reach = random.randint(5000, 25000)

    reels = []
    
    caption_templates = [
        "Day in the life of a creator! 🎥 What's your favorite part of the process? #behindthescenes #creatorlife",
        "Wait for the end... you won't believe this trick! 🤯 Drop a 💯 if you're trying this tomorrow.",
        "Unpopular opinion: You don't need a $3000 camera to start. Just start. ✨ #videography #tips",
        "Here's my exact workflow for editing 5 videos in 2 hours. Save this for later! 💾",
        "I tested the newest algorithm update so you don't have to. Here's what I found... 👇",
        "GRWM while I talk about my biggest failure this year. Vulnerability is key. 🫶",
        "pov: you finally figure out how to balance creation and life. ☕️",
        "3 tools I can't live without. Number 2 is a lifesaver. Link in bio! 🔗",
    ]

    # Generate 30 reels over the last 30 days
    for i in range(30):
        # Evenly spread over the past 30 days, somewhat randomized hours
        published_at = now - timedelta(days=i, hours=random.randint(0, 23))

        # Introduce distinct performance tiers
        performance_tier = random.choices(["viral", "good", "average", "flop"], weights=[0.05, 0.25, 0.5, 0.2])[0]
        
        if performance_tier == "viral":
            reach = int(base_reach * random.uniform(3.0, 8.0))
            engagement_multiplier = random.uniform(0.12, 0.25)
        elif performance_tier == "good":
            reach = int(base_reach * random.uniform(1.2, 2.0))
            engagement_multiplier = random.uniform(0.08, 0.15)
        elif performance_tier == "flop":
            reach = int(base_reach * random.uniform(0.1, 0.4))
            engagement_multiplier = random.uniform(0.02, 0.05)
        else: # average
            reach = int(base_reach * random.uniform(0.8, 1.2))
            engagement_multiplier = random.uniform(0.05, 0.09)

        # Force a severe reach anomaly in the last 3 days
        if i < 3:
            reach = int(base_reach * random.uniform(0.2, 0.35))
            engagement_multiplier = random.uniform(0.03, 0.06)

        likes = int(reach * engagement_multiplier)
        comments = int(likes * random.uniform(0.05, 0.15))
        saves = int(likes * random.uniform(0.1, 0.4)) if performance_tier in ["viral", "good"] else int(likes * random.uniform(0.01, 0.05))

        caption = random.choice(caption_templates)

        reel = Reel(
            id=str(uuid.uuid4()),
            creator_id=creator_id,
            ig_media_id=f"mock_media_{i}_{random.randint(10000, 99999)}",
            permalink="https://instagram.com/",
            thumbnail_url=f"https://images.unsplash.com/photo-{1610000000000 + i*1000}?w=500&q=80",
            caption=f"{caption}\n\n[Mock Reel #{i+1}]",
            published_at=published_at,
            like_count=likes,
            comments_count=comments,
            reach=reach,
            plays=int(reach * random.uniform(1.05, 1.3)),
            saved=saves,
            total_interactions=likes + comments + saves + int(reach * 0.01),
            avg_watch_time_ms=random.uniform(3000, 25000) if performance_tier in ["viral", "good"] else random.uniform(1500, 5000)
        )
        db.add(reel)

    db.commit()

def get_mock_creator_metrics(db: Session, creator_id: str) -> dict:
    """Helper to pull follower count and average engagement rate from mock data for Monetization services."""
    seed_mock_instagram_data(db, creator_id)
    account = db.query(InstagramAccount).filter(InstagramAccount.creator_id == creator_id).first()
    reels = db.query(Reel).filter(Reel.creator_id == creator_id).all()
    
    follower_count = account.followers_count if account else 10000
    
    total_reach = 0
    total_interactions = 0
    for r in reels:
        total_reach += r.reach or 0
        total_interactions += r.total_interactions or 0
        
    engagement_rate = 0.05
    if total_reach > 0:
        engagement_rate = total_interactions / total_reach
        
    return {
        "follower_count": follower_count,
        "engagement_rate": round(engagement_rate, 4),
        "niche": "lifestyle" # Default mock niche
    }
