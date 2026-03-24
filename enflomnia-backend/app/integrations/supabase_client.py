"""
Supabase Client — Storage & Realtime Layer
Gracefully degrades if supabase is not configured.
"""
from functools import lru_cache
from app.config import get_settings


class _NoOpSupabase:
    """Stub that silently does nothing when Supabase is unavailable."""
    class _Storage:
        def from_(self, bucket):
            return self
        def upload(self, *args, **kwargs):
            pass
        def update(self, *args, **kwargs):
            pass
        def get_public_url(self, path):
            return f"https://placeholder.supabase.co/storage/{path}"
    storage = _Storage()


@lru_cache()
def get_supabase():
    """Return a Supabase client, or a no-op stub if unavailable."""
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_key:
        print("[SUPABASE] No credentials configured. Direct client disabled.")
        return _NoOpSupabase()
    try:
        from supabase import create_client
        return create_client(settings.supabase_url, settings.supabase_key)
    except ImportError:
        print("[SUPABASE] supabase package not importable. Using no-op stub.")
        return _NoOpSupabase()
    except Exception as e:
        print(f"[SUPABASE] Init failed ({e}). Using no-op stub.")
        return _NoOpSupabase()


def upload_to_storage(bucket: str, path: str, data: bytes, content_type: str = "application/json") -> str:
    """Upload a file to Supabase Storage and return the public URL."""
    client = get_supabase()
    try:
        client.storage.from_(bucket).upload(path, data, {"content-type": content_type})
    except Exception:
        try:
            client.storage.from_(bucket).update(path, data, {"content-type": content_type})
        except Exception:
            pass
    try:
        res = client.storage.from_(bucket).get_public_url(path)
        return res
    except Exception:
        return f"https://placeholder.supabase.co/storage/{path}"
