from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr
import enum

class RoleEnum(str, enum.Enum):
    admin = "admin"
    user = "user"

class GenderEnum(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"

class AuthProviderEnum(str, enum.Enum):
    email = "email"
    google = "google"

class User(BaseModel):
    id: Optional[str] = None
    full_name: str
    username: str
    email: EmailStr
    password_hash: Optional[str] = None
    role: RoleEnum = RoleEnum.user
    auth_provider: AuthProviderEnum = AuthProviderEnum.email  # NEW FIELD
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    is_active: bool = True

    # OTP fields
    otp_code: Optional[str] = None
    otp_created_at: Optional[datetime] = None
    is_verified: bool = False
    otp_attempts: int = 0
    otp_locked_until: Optional[datetime] = None

    class Config:
        from_attributes = True
        use_enum_values = True