from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from typing import List, Optional
from datetime import datetime
import os, uuid
from bson import ObjectId

from database import get_database
from models.user import RoleEnum
from schemas.user import UserCreate, AdminUserCreate, UserOut, UserLogin
from utils.security import hash_password, verify_password, create_access_token
from dependencies import get_current_user, require_admin

# Create directory if not exists
UPLOAD_DIR = "static/avatars"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/users", tags=["Users"])

async def get_user_crud(db=Depends(get_database)):
    from crud.user import UserCRUD
    return UserCRUD(db)

# FIXED: Updated signup function for new two-role system
@router.post("/signup", response_model=UserOut)
async def signup(
    full_name: str = Form(...),
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    confirm_password: str = Form(...),
    avatar: UploadFile = File(None),  # Renamed from 'file' for clarity
    crud = Depends(get_user_crud)
):
    """
    User registration endpoint.
    All new users are registered as regular 'user' role by default.
    """
    print("✅ SIGNUP ENDPOINT HIT!")
    
    # Confirm password match
    if password != confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    # Validate password strength
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Validate username format
    if not username.replace('_', '').isalnum():
        raise HTTPException(status_code=400, detail="Username can only contain letters, numbers, and underscores")
    
    # Handle avatar upload
    avatar_url = None
    if avatar:
        allowed_exts = [".jpg", ".jpeg", ".png", ".gif"]
        ext = os.path.splitext(avatar.filename)[1].lower()
        if ext not in allowed_exts:
            raise HTTPException(status_code=400, detail="Only .jpg, .jpeg, .png, .gif allowed")
        
        # Check file size (max 5MB)
        content = await avatar.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Avatar must be less than 5MB")
        
        # Reset file pointer
        avatar.file.seek(0)
        
        # Save file
        filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(content)
        avatar_url = f"/static/avatars/{filename}"
    
    # Normalize email
    email = email.lower().strip()
    username = username.strip()
    
    # Check if user already exists
    existing_email = await crud.get_user_by_email(email)
    existing_username = await crud.get_user_by_username(username)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create UserCreate object - All signups are regular 'user' role
    user_data = UserCreate(
        full_name=full_name.strip(),
        username=username,
        email=email,
        password=password,
        role=RoleEnum.user  # FIXED: Only 'user' role for self-registration
    )
    
    # Create user using the existing create_user method
    user = await crud.create_user(user_data, avatar_url=avatar_url)
    if not user:
        raise HTTPException(status_code=500, detail="Failed to create user")
    
    print(f"✅ User Created Successfully: {user.username} ({user.email})")
    
    return user

# FIXED: Admin-only endpoint to create users with any role
@router.post("/admin/create", response_model=UserOut, dependencies=[Depends(require_admin)])
async def admin_create_user(
    user_data: AdminUserCreate,
    crud = Depends(get_user_crud)
):
    """
    Admin-only endpoint to create users with any role.
    """
    # Check if user already exists
    existing_email = await crud.get_user_by_email(user_data.email.lower())
    existing_username = await crud.get_user_by_username(user_data.username)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create user
    user = await crud.create_user(user_data)
    if not user:
        raise HTTPException(status_code=500, detail="Failed to create user")
    
    return user

# FIXED: Login function - simplified for two-role system
@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    crud = Depends(get_user_crud)
):
    """
    User login endpoint.
    Returns JWT token for Authorization header.
    """
    identifier = form_data.username.strip()
    print(f"🔍 Login attempt with identifier: '{identifier}'")
    
    # Find user by email OR username
    user = await crud.get_user_by_identifier(identifier)
    
    if not user:
        print(f"❌ User not found for identifier: '{identifier}'")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    print(f"✅ User found: {user.username} ({user.email})")
    
    # Verify password
    if not verify_password(form_data.password, user.password_hash):
        print(f"❌ Invalid password for user: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Ensure user account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is deactivated. Contact admin."
        )
    
    # Update last login
    await crud.update_last_login(user.id)
    
    # Create token with 30-day expiration
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 30 * 24 * 60 * 60,  # 30 days in seconds
        "user": {
            "id": str(user.id),
            "email": user.email,
            "role": user.role,
            "username": user.username,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "is_active": user.is_active
        }
    }

@router.get("/me", response_model=UserOut)
async def get_current_user_profile(
    current_user = Depends(get_current_user)
):
    """
    Get current user's profile.
    """
    return current_user

@router.get("/", response_model=List[UserOut], dependencies=[Depends(require_admin)])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    role: Optional[RoleEnum] = None,
    is_active: Optional[bool] = None,
    crud = Depends(get_user_crud)
):
    """
    Admin-only: List all users with optional filters.
    """
    users = await crud.get_users(skip=skip, limit=limit, role=role, is_active=is_active)
    return users

@router.put("/me", response_model=UserOut)
async def update_profile(
    full_name: Optional[str] = Form(None),
    username: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    current_user = Depends(get_current_user),
    crud = Depends(get_user_crud)
):
    """
    Update current user's profile.
    """
    # Handle avatar upload if provided
    avatar_url = current_user.avatar_url
    if avatar:
        allowed_exts = [".jpg", ".jpeg", ".png", ".gif"]
        ext = os.path.splitext(avatar.filename)[1].lower()
        if ext not in allowed_exts:
            raise HTTPException(status_code=400, detail="Only .jpg, .jpeg, .png, .gif allowed")
        
        # Check file size (max 5MB)
        content = await avatar.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Avatar must be less than 5MB")
        
        # Reset file pointer
        avatar.file.seek(0)
        
        # Save file
        filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(content)
        avatar_url = f"/static/avatars/{filename}"
    
    # Update user
    update_data = {}
    if full_name:
        update_data["full_name"] = full_name.strip()
    if username:
        update_data["username"] = username.strip()
    if avatar_url:
        update_data["avatar_url"] = avatar_url
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided for update")
    
    updated_user = await crud.update_user(current_user.id, update_data)
    if not updated_user:
        raise HTTPException(status_code=500, detail="Failed to update profile")
    
    return updated_user

@router.post("/logout")
async def logout():
    """
    Logout endpoint - client should remove token from storage.
    """
    return {"message": "Successfully logged out - remove token from client storage"}

@router.put("/deactivate", dependencies=[Depends(require_admin)])
async def deactivate_user(
    user_id: str,
    crud = Depends(get_user_crud)
):
    """
    Admin-only: Deactivate a user account.
    """
    result = await crud.deactivate_user(user_id)
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User {user_id} deactivated"}

@router.put("/activate", dependencies=[Depends(require_admin)])
async def activate_user(
    user_id: str,
    crud = Depends(get_user_crud)
):
    """
    Admin-only: Activate a deactivated user account.
    """
    result = await crud.activate_user(user_id)
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User {user_id} activated"}