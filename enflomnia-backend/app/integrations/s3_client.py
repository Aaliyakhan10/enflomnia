import json
import boto3
from datetime import datetime
from app.config import get_settings

settings = get_settings()


class S3Client:
    """
    Wrapper for Amazon S3 object storage.
    Used for comment batch archives and reach data exports.
    """

    def __init__(self):
        self.client = boto3.client(
            "s3",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id or None,
            aws_secret_access_key=settings.aws_secret_access_key or None,
        )
        self.bucket = settings.s3_bucket_name

    def upload_json(self, key: str, data: dict | list) -> bool:
        """Upload a JSON-serializable object to S3."""
        if not self.bucket:
            return False  # Dev mode: skip
        try:
            self.client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=json.dumps(data, default=str),
                ContentType="application/json",
            )
            return True
        except Exception:
            return False

    def archive_comments(self, creator_id: str, comments: list[dict]) -> str:
        """Archive a comment batch to S3. Returns the S3 key."""
        timestamp = datetime.utcnow().strftime("%Y/%m/%d/%H%M%S")
        key = f"comments/{creator_id}/{timestamp}.json"
        self.upload_json(key, {"creator_id": creator_id, "comments": comments})
        return key

    def archive_reach_snapshot(self, creator_id: str, snapshot: dict) -> str:
        """Archive a reach snapshot to S3. Returns the S3 key."""
        timestamp = datetime.utcnow().strftime("%Y/%m/%d/%H%M%S")
        key = f"reach/{creator_id}/{timestamp}.json"
        self.upload_json(key, snapshot)
        return key

    def archive_workload_signal(self, creator_id: str, signal: dict) -> str:
        """Archive a workload signal to S3. Returns the S3 key."""
        timestamp = datetime.utcnow().strftime("%Y/%m/%d/%H%M%S")
        key = f"workload/{creator_id}/{timestamp}.json"
        self.upload_json(key, signal)
        return key

    def archive_json(self, data: dict, prefix: str) -> str:
        """Generic JSON archive to S3 under a given prefix. Returns the S3 key."""
        timestamp = datetime.utcnow().strftime("%Y/%m/%d/%H%M%S")
        key = f"{prefix}/{timestamp}.json"
        self.upload_json(key, data)
        return key
