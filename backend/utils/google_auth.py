import os
from typing import Optional, Dict, Any
from google.oauth2 import id_token
from google.auth.transport import requests
from fastapi import HTTPException
import requests as http_requests
from urllib.parse import urlencode
import logging

logger = logging.getLogger(__name__)

class GoogleOAuth:
    def __init__(self):
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        
        if not self.client_id:
            logger.error("GOOGLE_CLIENT_ID is not set in environment variables")
            raise ValueError("GOOGLE_CLIENT_ID is required")
        
        if not self.client_secret:
            logger.error("GOOGLE_CLIENT_SECRET is not set in environment variables")
            raise ValueError("GOOGLE_CLIENT_SECRET is required")
        
        # Use different redirect URI based on environment
        if os.getenv("ENVIRONMENT") == "production":
            self.redirect_uri = os.getenv("GOOGLE_REDIRECT_URI_PROD")
        else:
            self.redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
            
        if not self.redirect_uri:
            logger.error("Google redirect URI is not set")
            raise ValueError("Google redirect URI is required")
            
        logger.info(f"Google OAuth initialized with client_id: {self.client_id[:10]}...")
        logger.info(f"Redirect URI: {self.redirect_uri}")
    
    def get_authorization_url(self, state: Optional[str] = None) -> str:
        """Generate Google OAuth authorization URL"""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
            "include_granted_scopes": "true"
        }
        
        if state:
            params["state"] = state
            
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
        logger.debug(f"Generated auth URL: {auth_url[:100]}...")
        return auth_url
    
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
        
        logger.debug(f"Exchanging code for token with redirect_uri: {self.redirect_uri}")
        
        try:
            response = http_requests.post(token_url, data=data, timeout=10)
            
            if response.status_code != 200:
                logger.error(f"Token exchange failed: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to exchange code for token: {response.text}"
                )
            
            token_data = response.json()
            logger.debug(f"Token exchange successful, got id_token: {'id_token' in token_data}")
            return token_data
            
        except Exception as e:
            logger.error(f"Token exchange error: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Token exchange failed: {str(e)}"
            )
    
    async def get_user_info(self, id_token_str: str) -> Dict[str, Any]:
        """Verify ID token and get user info"""
        try:
            logger.debug(f"Verifying ID token, length: {len(id_token_str)}")
            
            # Verify the token
            idinfo = id_token.verify_oauth2_token(
                id_token_str,
                requests.Request(),
                self.client_id
            )
            
            # Check audience
            if idinfo['aud'] != self.client_id:
                logger.error(f"Invalid audience: expected {self.client_id}, got {idinfo['aud']}")
                raise ValueError(f"Invalid audience. Expected: {self.client_id}")
            
            user_info = {
                "google_id": idinfo["sub"],
                "email": idinfo["email"],
                "email_verified": idinfo.get("email_verified", False),
                "full_name": idinfo.get("name", ""),
                "first_name": idinfo.get("given_name", ""),
                "last_name": idinfo.get("family_name", ""),
                "picture": idinfo.get("picture", ""),
                "locale": idinfo.get("locale", "en")
            }
            
            logger.debug(f"User info retrieved for: {user_info['email']}")
            return user_info
            
        except ValueError as e:
            logger.error(f"ID token verification failed: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid token: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error in get_user_info: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Failed to get user info: {str(e)}"
            )
    
    async def get_user_info_from_code(self, code: str) -> Dict[str, Any]:
        """Get user info directly from authorization code"""
        try:
            logger.debug(f"Getting user info from code: {code[:20]}...")
            token_data = await self.exchange_code_for_token(code)
            id_token_str = token_data.get("id_token")
            
            if not id_token_str:
                logger.error("No ID token in response from Google")
                raise HTTPException(
                    status_code=400,
                    detail="No ID token in response from Google"
                )
            
            return await self.get_user_info(id_token_str)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in get_user_info_from_code: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Failed to process Google authentication: {str(e)}"
            )

# Initialize Google OAuth client
try:
    google_oauth = GoogleOAuth()
    logger.info("Google OAuth initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Google OAuth: {str(e)}")
    google_oauth = None