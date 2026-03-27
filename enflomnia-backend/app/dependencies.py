from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import get_settings

settings = get_settings()
security = HTTPBearer()

# Supabase Auth details
# In Supabase, the public key is usually the same as the JWT Secret for HS256
# or you can fetch the JWKS from https://<project-id>.supabase.co/auth/v1/.well-known/jwks.json
ALGORITHM = "HS256"

async def get_current_user(auth: HTTPAuthorizationCredentials = Depends(security)):
    """
    FastAPI dependency to verify Supabase JWT.
    Extracts user info (sub/email) from the token.
    """
    token = auth.credentials
    try:
        # We use the Supabase JWT Secret to verify the token
        # This is often the same as the service_role key or just 'supabase_key' depending on config
        payload = jwt.decode(
            token, 
            settings.supabase_key, 
            algorithms=[ALGORITHM], 
            audience="authenticated"
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
        return {"id": user_id, "email": payload.get("email"), "app_metadata": payload.get("app_metadata")}
    except JWTError as e:
        print(f"[AUTH ERROR] {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
