import os
from typing import Optional, Dict, Any
from google.oauth2 import id_token
from google.auth.transport import requests
from fastapi import HTTPException
import requests as http_requests
from urllib.parse import urlencode

class GoogleOAuth:
    def __init__(self):
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        
        # Use different redirect URI based on environment
        if os.getenv("ENVIRONMENT") == "production":
            self.redirect_uri = os.getenv("GOOGLE_REDIRECT_URI_PROD")
        else:
            self.redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    
    def get_authorization_url(self, state: Optional[str] = None) -> str:
        """Generate Google OAuth authorization URL"""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent"
        }
        
        if state:
            params["state"] = state
            
        return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code"
        }
        
        response = http_requests.post(token_url, data=data)
        if response.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail="Failed to exchange code for token"
            )
        
        return response.json()
    
    async def get_user_info(self, id_token_str: str) -> Dict[str, Any]:
        """Verify ID token and get user info"""
        try:
            # Verify the token
            idinfo = id_token.verify_oauth2_token(
                id_token_str,
                requests.Request(),
                self.client_id
            )
            
            # Check audience
            if idinfo['aud'] != self.client_id:
                raise ValueError("Invalid audience")
            
            return {
                "google_id": idinfo["sub"],
                "email": idinfo["email"],
                "email_verified": idinfo.get("email_verified", False),
                "full_name": idinfo.get("name", ""),
                "first_name": idinfo.get("given_name", ""),
                "last_name": idinfo.get("family_name", ""),
                "picture": idinfo.get("picture", ""),
                "locale": idinfo.get("locale", "en")
            }
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid token: {str(e)}"
            )
    
    async def get_user_info_from_code(self, code: str) -> Dict[str, Any]:
        """Get user info directly from authorization code"""
        token_data = await self.exchange_code_for_token(code)
        id_token_str = token_data.get("id_token")
        
        if not id_token_str:
            raise HTTPException(
                status_code=400,
                detail="No ID token in response"
            )
        
        return await self.get_user_info(id_token_str)

# Initialize Google OAuth client
google_oauth = GoogleOAuth()