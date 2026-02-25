"""
Tests for Reach Anomaly Service
"""
import pytest
from unittest.mock import MagicMock, patch
from app.services.reach_anomaly import ReachAnomalyService
from app.models.reach_snapshot import ReachSnapshot


@pytest.fixture
def service():
    with patch("app.services.reach_anomaly.BedrockClient"), \
         patch("app.services.reach_anomaly.OpenSearchClient"), \
         patch("app.services.reach_anomaly.S3Client"):
        return ReachAnomalyService()


@pytest.fixture
def mock_db():
    return MagicMock()


def _make_snapshots(reach_values: list) -> list:
    snaps = []
    from datetime import datetime, timedelta
    for i, r in enumerate(reach_values):
        s = MagicMock(spec=ReachSnapshot)
        s.reach = r
        s.recorded_at = datetime.utcnow() - timedelta(days=i)
        snaps.append(s)
    return snaps


class TestReachAnomalyService:

    def test_rolling_baseline(self, service):
        snaps = _make_snapshots([1000, 1200, 900, 1100, 1050])
        baseline = service._rolling_baseline(snaps)
        assert 900 <= baseline <= 1200

    def test_no_anomaly_when_stable(self, service, mock_db):
        # All snapshots stable ~ 1000 reach
        snaps = _make_snapshots([1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000])
        mock_db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = snaps

        result = service.analyze(mock_db, "creator-1")
        assert result["anomaly_type"] == "none"

    def test_detects_creator_specific_drop(self, service, mock_db):
        # Latest = 400 (60% drop from baseline of 1000)
        snaps = _make_snapshots([400, 1000, 1000, 1000, 1000, 1000, 1000, 1000])
        mock_db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = snaps

        # No similar creators affected
        service._get_recent_similar_creators = MagicMock(return_value=[])
        service._detect_platform_wide = MagicMock(return_value=False)
        service._get_claude_reasoning = MagicMock(return_value="Your reach dropped significantly.")

        result = service.analyze(mock_db, "creator-1")
        assert result["anomaly_type"] == "creator_specific"
        assert result["drop_percentage"] > 20

    def test_detects_platform_wide_drop(self, service, mock_db):
        snaps = _make_snapshots([400, 1000, 1000, 1000, 1000, 1000, 1000, 1000])
        mock_db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = snaps

        service._get_recent_similar_creators = MagicMock(return_value=["creator-2", "creator-3"])
        service._detect_platform_wide = MagicMock(return_value=True)
        service._get_claude_reasoning = MagicMock(return_value="Platform-wide issue detected.")

        result = service.analyze(mock_db, "creator-1")
        assert result["anomaly_type"] == "platform_wide"

    def test_insufficient_data(self, service, mock_db):
        snaps = _make_snapshots([1000])  # Only one data point
        mock_db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = snaps

        result = service.analyze(mock_db, "creator-1")
        assert result["anomaly_type"] == "none"
        assert "enough data" in result["reasoning"].lower()
