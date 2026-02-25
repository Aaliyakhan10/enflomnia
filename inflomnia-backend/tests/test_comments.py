"""
Tests for Comment Shield Service
"""
import pytest
from unittest.mock import MagicMock, patch
from app.services.comment_shield import CommentShieldService


@pytest.fixture
def service():
    with patch("app.services.comment_shield.GuardrailsClient"), \
         patch("app.services.comment_shield.BedrockAgentClient"), \
         patch("app.services.comment_shield.BedrockClient"), \
         patch("app.services.comment_shield.S3Client"):
        svc = CommentShieldService()
        # Disable agent (fall through to direct classification)
        svc.agent.agent_id = ""
        return svc


class TestCommentShieldService:

    def test_bot_heuristic_spam_link(self, service):
        score = service._bot_heuristic_score("Check my profile for amazing deals! DM for collab 🔥🔥🔥🔥🔥🔥", "user123")
        assert score >= 0.5

    def test_bot_heuristic_clean_comment(self, service):
        score = service._bot_heuristic_score("Love your content! The tips you shared really helped me.", "fan_user")
        assert score < 0.3

    def test_bot_heuristic_excessive_emoji(self, service):
        score = service._bot_heuristic_score("Amazing!!! 🔥🔥🔥🔥🔥🔥🔥🔥", "some_user")
        assert score >= 0.3

    def test_get_summary_empty(self, service):
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.all.return_value = []
        summary = service.get_summary(mock_db, "creator-1")
        assert summary["total"] == 0
        assert summary["spam"] == 0

    def test_guardrail_category_mapping(self, service):
        assert service._guardrail_category_to_label("HATE") == "toxic"
        assert service._guardrail_category_to_label("INSULTS") == "toxic"
        assert service._guardrail_category_to_label("OTHER") == "spam"
