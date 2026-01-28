from typing import Optional, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict
import enum

class RoleEnum(str, enum.Enum):
    admin = "admin"
    user = "user"

class UserCreate(BaseModel):
    """Model for user registration"""
    full_name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_]+$')
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    role: RoleEnum = RoleEnum.user

class AdminUserCreate(BaseModel):
    """Model for admin creating users (with extra admin-only fields)"""
    full_name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_]+$')
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    role: RoleEnum = RoleEnum.user
    is_active: bool = True

class UserUpdate(BaseModel):
    """Model for updating user profile"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    username: Optional[str] = Field(None, min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_]+$')
    avatar_url: Optional[str] = None

class AdminUserUpdate(BaseModel):
    """Model for admin updating users (can change role and status)"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    username: Optional[str] = Field(None, min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_]+$')
    email: Optional[EmailStr] = None
    role: Optional[RoleEnum] = None
    is_active: Optional[bool] = None
    avatar_url: Optional[str] = None

class PasswordChange(BaseModel):
    """Model for changing password"""
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=100)

class UserOut(BaseModel):
    """Response model for user data (public/safe fields)"""
    id: str
    full_name: str
    username: str
    email: EmailStr
    role: str
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    """Model for login credentials"""
    email: EmailStr
    password: str

class Token(BaseModel):
    """Response model for authentication token"""
    access_token: str
    token_type: str = "bearer"
    expires_in: Optional[int] = None  # Token expiry in seconds
    user: Optional[UserOut] = None  # Include user data in login response

    model_config = ConfigDict(from_attributes=True)

class ResetPasswordRequest(BaseModel):
    """Model for requesting password reset"""
    email: EmailStr

class ResetPasswordConfirm(BaseModel):
    """Model for confirming password reset"""
    token: str
    new_password: str = Field(..., min_length=6, max_length=100)

# MongoDB document model (for database operations)
class UserInDB(BaseModel):
    """Internal model for database operations"""
    full_name: str
    username: str
    email: EmailStr
    hashed_password: str
    role: RoleEnum
    avatar_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    refresh_token: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

# Utility models for pagination/filtering
class UserFilters(BaseModel):
    """Filters for user queries"""
    role: Optional[RoleEnum] = None
    is_active: Optional[bool] = None
    search: Optional[str] = None  

class PaginatedUsers(BaseModel):
    """Response model for paginated user list"""
    users: list[UserOut]
    total: int
    page: int
    per_page: int
    total_pages: int

class OTPRequest(BaseModel):
    """Model for requesting OTP"""
    email: EmailStr

class OTPVerify(BaseModel):
    """Model for verifying OTP"""
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6, pattern=r'^\d{6}$')

class OTPResend(BaseModel):
    """Model for resending OTP"""
    email: EmailStr

class OTPResponse(BaseModel):
    """Response model for OTP operations"""
    message: str
    email: EmailStr
    success: bool
    retry_after: Optional[int] = None  