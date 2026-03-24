import argparse
import sys
from sqlalchemy import create_engine
from app.database import Base
from app.config import get_settings
import app.models  # noqa: F401

def migrate(database_url: str = None):
    settings = get_settings()
    url = database_url or settings.database_url
    
    print(f"Starting migration on: {url}")
    
    if "sqlite" in url:
        print("Warning: Running migration on SQLite.")
    
    try:
        engine = create_engine(url)
        Base.metadata.create_all(bind=engine)
        print("Migration successful: All tables created/updated.")
    except Exception as e:
        print(f"Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run database migrations.")
    parser.add_argument("--url", type=str, help="Database URL (overrides env)")
    args = parser.parse_args()
    
    migrate(args.url)
