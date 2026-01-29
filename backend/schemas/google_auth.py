from pydantic import BaseModel, EmailStr
from typing import Optional

class GoogleAuthRequest(BaseModel):
    """Schema for Google OAuth authorization request"""
    code: str
    state: Optional[str] = None

class GoogleUserCreate(BaseModel):
    """Schema for creating user from Google OAuth"""
    google_id: str
    email: EmailStr
    email_verified: bool = False
    full_name: str
    picture: Optional[str] = None
    locale: Optional[str] = "en"

class GoogleAuthResponse(BaseModel):
    """Response model for Google authentication"""
    access_token: str
    token_type: str = "bearer"
    expires_in: Optional[int] = None
    is_new_user: bool = False
    user: dict