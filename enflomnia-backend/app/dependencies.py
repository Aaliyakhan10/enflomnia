from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import get_settings

settings = get_settings()
security = HTTPBearer()

# Supabase Auth details
# In Supabase, the public key is usually the same as the JWT Secret for HS256
# or you can fetch the JWKS from https://<project-id>.supabase.co/auth/v1/.well-known/jwks.json
ALGORITHMS = ["HS256", "RS256"]

async def get_current_user(auth: HTTPAuthorizationCredentials = Depends(security)):
    """
    FastAPI dependency to verify Supabase JWT.
    Extracts user info (sub/email) from the token.
    """
    token = auth.credentials
    
    # ── DEBUG LOGGING ────────────────────────────────────────────────────────
    if settings.debug:
        try:
            unverified_header = jwt.get_unverified_header(token)
            print(f"[AUTH DEBUG] Token Header: {unverified_header}")
        except Exception as e:
            print(f"[AUTH DEBUG] Failed to get unverified header: {e}")

    # ── DEVELOPER BYPASS ───────────────────────────────────────────────────
    # If in debug mode and token is a "mock" token or if secret is missing
    if settings.debug and (token == "dev-token" or not settings.jwt_secret):
        print("[AUTH WARNING] Bypassing real JWT verification (Development Mode)")
        return {
            "id": "00000000-0000-0000-0000-000000000000", 
            "email": "dev@enflomnia.com", 
            "app_metadata": {"role": "authenticated"}
        }

    try:
        # 1. Try with JWT Secret (Recommended)
        # 2. Try with Supabase Key (Legacy fallback, often used incorrectly as secret)
        secret_to_use = settings.jwt_secret or settings.supabase_key
        
        payload = jwt.decode(
            token, 
            secret_to_use, 
            algorithms=ALGORITHMS, 
            audience="authenticated"
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
        return {
            "id": user_id, 
            "email": payload.get("email"), 
            "app_metadata": payload.get("app_metadata", {})
        }
    except JWTError as e:
        print(f"[AUTH ERROR] {e}")
        # If decryption fails but we're in debug, give a detailed error
        detail = f"Could not validate credentials: {str(e)}"
        if "alg" in str(e).lower():
            detail += ". (Hint: The backend expects HS256/RS256. Check your provider settings.)"
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )
