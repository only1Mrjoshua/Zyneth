"""
Google OAuth authentication router - FIXED VERSION
"""
import secrets
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
import httpx
from pydantic import BaseModel

from database import get_database
from utils.security import create_access_token
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# CRITICAL FIX: Always use localhost for local testing
# When running locally, ALWAYS use localhost redirect URI
IS_LOCAL = os.getenv("RENDER") != "true"  # Render sets RENDER=true

if IS_LOCAL:
    # LOCAL DEVELOPMENT
    GOOGLE_REDIRECT_URI = "http://localhost:8000/auth/google/callback"
    FRONTEND_URL = "http://127.0.0.1:5500/frontend"
    print("🖥️  Running in LOCAL development mode")
else:
    # PRODUCTION (Render)
    GOOGLE_REDIRECT_URI = "https://zyneth-backend.onrender.com/auth/google/callback"
    FRONTEND_URL = "https://zyneth.shop"
    print("🚀 Running in PRODUCTION mode")

print("🔧 OAuth Configuration:")
print(f"   Environment: {'LOCAL' if IS_LOCAL else 'PRODUCTION'}")
print(f"   Google Client ID: {GOOGLE_CLIENT_ID[:10]}..." if GOOGLE_CLIENT_ID else "❌ MISSING")
print(f"   Google Client Secret: {'✅ SET' if GOOGLE_CLIENT_SECRET else '❌ MISSING'}")
print(f"   Redirect URI: {GOOGLE_REDIRECT_URI}")
print(f"   Frontend URL: {FRONTEND_URL}")

# Validate configuration
if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
    print("❌ CRITICAL ERROR: Google OAuth credentials missing!")
    print("   Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file")

class GoogleUserInfo(BaseModel):
    """Google user info from token validation"""
    email: str
    email_verified: bool
    name: str
    picture: Optional[str] = None
    given_name: Optional[str] = None
    family_name: Optional[str] = None
    sub: str  # Google user ID

async def get_user_crud(db=Depends(get_database)):
    from crud.user import UserCRUD
    return UserCRUD(db)

@router.get("/google/login")
async def google_login(request: Request):
    """
    Initiate Google OAuth flow
    """
    # Validate configuration
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        print("❌ Google OAuth not configured - missing client ID or secret")
        return RedirectResponse(f"{FRONTEND_URL}/signin.html?error=oauth_not_configured")
    
    # Generate secure state and nonce
    state = secrets.token_urlsafe(32)
    nonce = secrets.token_urlsafe(32)
    
    # Store state and nonce
    encoded_state = f"{state}|{nonce}"
    
    # Google OAuth URL parameters - CRITICAL: Use EXACT redirect_uri
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,  # MUST match Google Cloud Console exactly
        "response_type": "code",
        "scope": "openid email profile",  # Basic scopes only
        "state": encoded_state,
        "access_type": "online",  # Changed from offline to online for simplicity
        "prompt": "select_account",  # Changed from consent to select_account
    }
    
    # Build Google OAuth URL
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    
    print("=" * 60)
    print("🔗 Google OAuth Login Request:")
    print(f"   Redirect URI: {GOOGLE_REDIRECT_URI}")
    print(f"   Client ID: {GOOGLE_CLIENT_ID[:20]}...")
    print(f"   Auth URL: {auth_url[:100]}...")
    print("=" * 60)
    
    return RedirectResponse(url=auth_url)

@router.get("/google/callback")
async def google_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    crud=Depends(get_user_crud)
):
    """
    Handle Google OAuth callback
    """
    print(f"🔄 Google callback received")
    print(f"   Code present: {'✅' if code else '❌'}")
    print(f"   State present: {'✅' if state else '❌'}")
    print(f"   Error: {error if error else 'None'}")
    
    # Check for errors from Google
    if error:
        print(f"❌ Google OAuth error: {error}")
        return RedirectResponse(f"{FRONTEND_URL}/signin.html?error=google_auth_failed&message={error}")
    
    if not code:
        print("❌ No authorization code received from Google")
        return RedirectResponse(f"{FRONTEND_URL}/signin.html?error=no_auth_code")
    
    try:
        # Exchange authorization code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": GOOGLE_REDIRECT_URI,  # MUST match exactly
        }
        
        print("🔄 Exchanging code for tokens...")
        print(f"   Using redirect_uri: {GOOGLE_REDIRECT_URI}")
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data)
            
            if token_response.status_code != 200:
                print(f"❌ Token exchange failed: {token_response.status_code}")
                print(f"   Response: {token_response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Token exchange failed: {token_response.text}"
                )
            
            token_json = token_response.json()
            access_token = token_json.get("access_token")
            
            if not access_token:
                print("❌ No access token in response")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No access token received"
                )
            
            print("✅ Got access token, fetching user info...")
            
            # Get user info from Google
            userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
            headers = {"Authorization": f"Bearer {access_token}"}
            userinfo_response = await client.get(userinfo_url, headers=headers)
            
            if userinfo_response.status_code != 200:
                print(f"❌ Userinfo fetch failed: {userinfo_response.status_code}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to fetch user info"
                )
            
            userinfo = userinfo_response.json()
            print(f"✅ User info: {userinfo.get('email', 'No email')}")
            
            # Validate email
            if not userinfo.get("email"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No email in user info"
                )
            
            # Create user or get existing
            email = userinfo["email"]
            name = userinfo.get("name", email.split("@")[0])
            picture = userinfo.get("picture")
            
            existing_user = await crud.get_user_by_email(email)
            
            if existing_user:
                print(f"🔄 User exists: {email}")
                user = existing_user
            else:
                print(f"🔄 Creating new user: {email}")
                user = await crud.create_google_user(
                    email=email,
                    full_name=name,
                    picture=picture,
                    google_id=userinfo.get("sub")
                )
                
                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to create user"
                    )
            
            # Create JWT token
            jwt_token = create_access_token(
                data={"sub": user.email, "role": user.role}
            )
            
            # Redirect to frontend callback page
            callback_url = f"{FRONTEND_URL}/google-callback.html"
            callback_url += f"?token={jwt_token}"
            callback_url += f"&user_id={user.id}"
            callback_url += f"&email={user.email}"
            callback_url += f"&role={user.role}"
            
            if existing_user:
                callback_url += "&is_new=false"
            else:
                callback_url += "&is_new=true"
            
            print(f"🔗 Redirecting to: {callback_url}")
            
            response = RedirectResponse(url=callback_url)
            
            # Set cookie for API calls
            response.set_cookie(
                key="access_token",
                value=jwt_token,
                httponly=True,
                secure=not IS_LOCAL,  # Secure only in production
                samesite="lax",
                max_age=30 * 24 * 60 * 60,
                path="/"
            )
            
            return response
            
    except httpx.HTTPStatusError as e:
        print(f"❌ HTTP error: {e}")
        return RedirectResponse(f"{FRONTEND_URL}/signin.html?error=http_error")
    
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return RedirectResponse(f"{FRONTEND_URL}/signin.html?error=server_error")

@router.get("/test-config")
async def test_config():
    """Test endpoint to verify OAuth configuration"""
    return {
        "status": "ok",
        "environment": "local" if IS_LOCAL else "production",
        "google_client_id_set": bool(GOOGLE_CLIENT_ID),
        "google_client_secret_set": bool(GOOGLE_CLIENT_SECRET),
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "frontend_url": FRONTEND_URL,
        "expected_google_console_config": {
            "authorized_javascript_origins": [
                "http://localhost:5500",
                "http://127.0.0.1:5500", 
                "https://zyneth.shop",
                "https://www.zyneth.shop"
            ],
            "authorized_redirect_uris": [
                "http://localhost:8000/auth/google/callback",
                "https://zyneth-backend.onrender.com/auth/google/callback"
            ]
        }
    }

@router.post("/logout")
async def logout():
    """Logout endpoint"""
    response = RedirectResponse(url=f"{FRONTEND_URL}/signin.html")
    response.delete_cookie("access_token")
    return response