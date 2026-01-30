from typing import List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
import random
import string

from models.user import User, RoleEnum, AuthProviderEnum
from schemas.user import UserCreate, AdminUserCreate
from utils.security import hash_password

class UserCRUD:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def _is_connected(self):
        try:
            await self.db.command('ping')
            return True
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            return False

    def _convert_objectids_to_strings(self, data: dict) -> dict:
        if not data:
            return data
            
        converted = data.copy()
        
        if '_id' in converted and converted['_id']:
            converted['id'] = str(converted['_id'])
            del converted['_id']
        
        return converted

    async def get_user_by_email(self, email: str) -> Optional[User]:
        if not await self._is_connected():
            return None
            
        try:
            user_data = await self.db.users.find_one({"email": email.lower()})
            if user_data:
                user_data = self._convert_objectids_to_strings(user_data)
                return User(**user_data)
            return None
        except Exception as e:
            print(f"❌ Error getting user by email: {e}")
            return None

    async def get_user_by_username(self, username: str) -> Optional[User]:
        if not await self._is_connected():
            return None
            
        try:
            user_data = await self.db.users.find_one({"username": username})
            if user_data:
                user_data = self._convert_objectids_to_strings(user_data)
                return User(**user_data)
            return None
        except Exception as e:
            print(f"❌ Error getting user by username: {e}")
            return None

    async def get_user_by_identifier(self, identifier: str) -> Optional[User]:
        user = await self.get_user_by_email(identifier)
        if not user:
            user = await self.get_user_by_username(identifier)
        return user

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        if not await self._is_connected():
            return None
            
        try:
            user_data = await self.db.users.find_one({"_id": ObjectId(user_id)})
            if user_data:
                user_data = self._convert_objectids_to_strings(user_data)
                return User(**user_data)
            return None
        except Exception as e:
            print(f"❌ Error getting user by ID: {e}")
            return None

    async def create_user(
        self, 
        user_data: UserCreate, 
        avatar_url: str = None, 
        is_verified: bool = False,
        auth_provider: str = "email"  # NEW parameter for Google OAuth
    ) -> Optional[User]:
        """
        Create a new user with optional auth provider.
        First user becomes admin, subsequent users get the role from user_data.
        """
        if not await self._is_connected():
            return None
            
        try:
            # Check if user already exists
            existing_email = await self.get_user_by_email(user_data.email)
            existing_username = await self.get_user_by_username(user_data.username)
            
            if existing_email:
                return None
            if existing_username:
                return None

            # Determine role (first user becomes admin)
            user_count = await self.db.users.count_documents({})
            role = RoleEnum.admin if user_count == 0 else user_data.role

            # Prepare user document with OTP fields
            user_dict = {
                "full_name": user_data.full_name,
                "username": user_data.username,
                "email": user_data.email.lower(),
                "password_hash": hash_password(user_data.password) if user_data.password else None,
                "role": role,
                "auth_provider": auth_provider,  # NEW: Store auth provider
                "avatar_url": avatar_url,
                "created_at": datetime.utcnow(),
                "last_login": None,
                "is_active": True,
                # OTP fields
                "otp_code": None,
                "otp_created_at": None,
                "is_verified": is_verified,  # Google users are pre-verified
                "otp_attempts": 0,
                "otp_locked_until": None
            }

            # Add is_active for AdminUserCreate
            if isinstance(user_data, AdminUserCreate):
                user_dict["is_active"] = user_data.is_active

            result = await self.db.users.insert_one(user_dict)
            
            created_user = await self.db.users.find_one({"_id": result.inserted_id})
            
            if created_user:
                created_user = self._convert_objectids_to_strings(created_user)
                return User(**created_user)
            
            return None
            
        except Exception as e:
            print(f"❌ Error creating user: {e}")
            return None

    async def create_google_user(
        self,
        email: str,
        full_name: str,
        picture: str = None,
        google_id: str = None
    ) -> Optional[User]:
        """
        Create a new user from Google OAuth.
        """
        if not await self._is_connected():
            return None
            
        try:
            # Check if user already exists
            existing_user = await self.get_user_by_email(email)
            if existing_user:
                # Update user with Google info if needed
                update_data = {
                    "last_login": datetime.utcnow(),
                    "auth_provider": AuthProviderEnum.google,
                    "is_verified": True
                }
                if picture and not existing_user.avatar_url:
                    update_data["avatar_url"] = picture
                
                return await self.update_user(existing_user.id, update_data)

            # Generate username from email (prefix before @)
            username_base = email.split("@")[0].replace('.', '_').lower()
            username = username_base
            
            # Ensure username is unique
            counter = 1
            while await self.get_user_by_username(username):
                username = f"{username_base}{counter}"
                counter += 1

            # Determine role (first user becomes admin)
            user_count = await self.db.users.count_documents({})
            role = RoleEnum.admin if user_count == 0 else RoleEnum.user

            # Generate a random password (won't be used for Google auth users)
            random_password = ''.join(random.choices(string.ascii_letters + string.digits, k=16))

            # Create user document for Google user
            user_dict = {
                "full_name": full_name,
                "username": username,
                "email": email.lower(),
                "password_hash": hash_password(random_password),
                "role": role,
                "auth_provider": AuthProviderEnum.google,
                "avatar_url": picture,
                "created_at": datetime.utcnow(),
                "last_login": datetime.utcnow(),
                "is_active": True,
                # OTP fields
                "otp_code": None,
                "otp_created_at": None,
                "is_verified": True,  # Google emails are already verified
                "otp_attempts": 0,
                "otp_locked_until": None
            }

            result = await self.db.users.insert_one(user_dict)
            
            created_user = await self.db.users.find_one({"_id": result.inserted_id})
            
            if created_user:
                created_user = self._convert_objectids_to_strings(created_user)
                return User(**created_user)
            
            return None
            
        except Exception as e:
            print(f"❌ Error creating Google user: {e}")
            return None

    async def update_user(self, user_id: str, update_data: dict) -> Optional[User]:
        if not await self._is_connected():
            return None
            
        try:
            # Check username uniqueness if updating username
            if "username" in update_data:
                existing = await self.get_user_by_username(update_data["username"])
                if existing and str(existing.id) != user_id:
                    return None

            # Check email uniqueness if updating email
            if "email" in update_data:
                existing = await self.get_user_by_email(update_data["email"])
                if existing and str(existing.id) != user_id:
                    return None

            update_data["updated_at"] = datetime.utcnow()
            
            result = await self.db.users.find_one_and_update(
                {"_id": ObjectId(user_id)},
                {"$set": update_data},
                return_document=True
            )
            
            if result:
                result = self._convert_objectids_to_strings(result)
                return User(**result)
            return None
        except Exception as e:
            print(f"❌ Error updating user: {e}")
            return None

    async def update_last_login(self, user_id: str) -> bool:
        if not await self._is_connected():
            return False
            
        try:
            result = await self.db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"last_login": datetime.utcnow()}}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"❌ Error updating last login: {e}")
            return False

    async def get_users(self, skip: int = 0, limit: int = 100, 
                       role: Optional[RoleEnum] = None,
                       is_active: Optional[bool] = None) -> List[User]:
        if not await self._is_connected():
            return []
            
        try:
            query = {}
            if role:
                query["role"] = role
            if is_active is not None:
                query["is_active"] = is_active
            
            cursor = self.db.users.find(query).skip(skip).limit(limit)
            users_data = await cursor.to_list(length=limit)
            
            users = []
            for user_data in users_data:
                user_data = self._convert_objectids_to_strings(user_data)
                users.append(User(**user_data))
            
            return users
        except Exception as e:
            print(f"❌ Error getting users: {e}")
            return []

    async def count_users(self, role: Optional[RoleEnum] = None, 
                         is_active: Optional[bool] = None) -> int:
        if not await self._is_connected():
            return 0
            
        try:
            query = {}
            if role:
                query["role"] = role
            if is_active is not None:
                query["is_active"] = is_active
            
            return await self.db.users.count_documents(query)
        except Exception as e:
            print(f"❌ Error counting users: {e}")
            return 0

    async def deactivate_user(self, user_id: str) -> bool:
        if not await self._is_connected():
            return False
            
        try:
            result = await self.db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"❌ Error deactivating user: {e}")
            return False

    async def activate_user(self, user_id: str) -> bool:
        if not await self._is_connected():
            return False
            
        try:
            result = await self.db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"is_active": True, "updated_at": datetime.utcnow()}}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"❌ Error activating user: {e}")
            return False

    async def delete_user(self, user_id: str) -> bool:
        if not await self._is_connected():
            return False
            
        try:
            result = await self.db.users.delete_one({"_id": ObjectId(user_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"❌ Error deleting user: {e}")
            return False

    async def change_password(self, user_id: str, new_password_hash: str) -> bool:
        if not await self._is_connected():
            return False
            
        try:
            result = await self.db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"password_hash": new_password_hash, "updated_at": datetime.utcnow()}}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"❌ Error changing password: {e}")
            return False

    async def search_users(self, search_term: str, skip: int = 0, limit: int = 50) -> List[User]:
        """
        Search users by full_name, username, or email
        """
        if not await self._is_connected():
            return []
            
        try:
            query = {
                "$or": [
                    {"full_name": {"$regex": search_term, "$options": "i"}},
                    {"username": {"$regex": search_term, "$options": "i"}},
                    {"email": {"$regex": search_term, "$options": "i"}}
                ]
            }
            
            cursor = self.db.users.find(query).skip(skip).limit(limit)
            users_data = await cursor.to_list(length=limit)
            
            users = []
            for user_data in users_data:
                user_data = self._convert_objectids_to_strings(user_data)
                users.append(User(**user_data))
            
            return users
        except Exception as e:
            print(f"❌ Error searching users: {e}")
            return []

    # ========== OTP METHODS ==========

    async def generate_and_store_otp(self, email: str) -> Optional[str]:
        """
        Generate a 6-digit OTP and store it for the user.
        Returns the OTP code if successful, None otherwise.
        """
        if not await self._is_connected():
            return None
            
        try:
            # Check if user exists
            user = await self.get_user_by_email(email)
            if not user:
                return None
            
            # Check if user is OTP locked
            if user.otp_locked_until and user.otp_locked_until > datetime.utcnow():
                return None
            
            # Generate 6-digit OTP
            otp_code = str(random.randint(100000, 999999))
            
            # Store OTP with timestamp (valid for 10 minutes)
            update_data = {
                "otp_code": otp_code,
                "otp_created_at": datetime.utcnow(),
                "otp_attempts": 0,  # Reset attempts
                "otp_locked_until": None,
                "is_verified": False,  # Reset verification status
                "updated_at": datetime.utcnow()
            }
            
            result = await self.db.users.update_one(
                {"email": email},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                return otp_code
            return None
            
        except Exception as e:
            print(f"❌ Error generating OTP: {e}")
            return None

    async def verify_otp(self, email: str, otp_code: str) -> dict:
        """
        Verify OTP for a user.
        Returns a dictionary with verification result and status.
        """
        if not await self._is_connected():
            return {"success": False, "message": "Database error"}
            
        try:
            # Get user
            user = await self.get_user_by_email(email)
            if not user:
                return {"success": False, "message": "User not found"}
            
            # Check if user is OTP locked
            if user.otp_locked_until and user.otp_locked_until > datetime.utcnow():
                time_left = int((user.otp_locked_until - datetime.utcnow()).total_seconds())
                return {
                    "success": False, 
                    "message": "Too many attempts. Try again later.",
                    "locked": True,
                    "retry_after": time_left
                }
            
            # Check if OTP exists and is not expired (10 minutes)
            if not user.otp_code or not user.otp_created_at:
                await self._increment_otp_attempts(email)
                return {"success": False, "message": "Invalid or expired OTP"}
            
            otp_age = datetime.utcnow() - user.otp_created_at
            if otp_age > timedelta(minutes=10):
                await self._increment_otp_attempts(email)
                return {"success": False, "message": "OTP has expired"}
            
            # Verify OTP code
            if user.otp_code != otp_code:
                await self._increment_otp_attempts(email)
                remaining_attempts = 3 - (user.otp_attempts + 1)
                return {
                    "success": False, 
                    "message": f"Invalid OTP. {remaining_attempts} attempts remaining.",
                    "remaining_attempts": remaining_attempts
                }
            
            # OTP is valid - mark user as verified and clear OTP data
            update_data = {
                "is_verified": True,
                "otp_code": None,
                "otp_created_at": None,
                "otp_attempts": 0,
                "otp_locked_until": None,
                "updated_at": datetime.utcnow()
            }
            
            result = await self.db.users.update_one(
                {"email": email},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                return {"success": True, "message": "Email verified successfully"}
            return {"success": False, "message": "Verification failed"}
            
        except Exception as e:
            print(f"❌ Error verifying OTP: {e}")
            return {"success": False, "message": "Server error"}

    async def _increment_otp_attempts(self, email: str):
        """Increment OTP attempts and lock if too many failures."""
        try:
            user = await self.get_user_by_email(email)
            if not user:
                return
            
            new_attempts = user.otp_attempts + 1
            update_data = {"otp_attempts": new_attempts}
            
            # Lock user for 15 minutes after 3 failed attempts
            if new_attempts >= 3:
                update_data["otp_locked_until"] = datetime.utcnow() + timedelta(minutes=15)
            
            await self.db.users.update_one(
                {"email": email},
                {"$set": update_data}
            )
            
        except Exception as e:
            print(f"❌ Error incrementing OTP attempts: {e}")

    async def clear_otp_data(self, email: str) -> bool:
        """Clear OTP data for a user."""
        if not await self._is_connected():
            return False
            
        try:
            result = await self.db.users.update_one(
                {"email": email},
                {"$set": {
                    "otp_code": None,
                    "otp_created_at": None,
                    "otp_attempts": 0,
                    "otp_locked_until": None,
                    "updated_at": datetime.utcnow()
                }}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"❌ Error clearing OTP data: {e}")
            return False

    async def resend_otp(self, email: str) -> Optional[str]:
        """
        Resend OTP to a user.
        Returns new OTP code if successful, None otherwise.
        """
        # Clear existing OTP data first
        await self.clear_otp_data(email)
        
        # Generate new OTP
        return await self.generate_and_store_otp(email)

    async def check_otp_status(self, email: str) -> dict:
        """Check OTP status for a user."""
        user = await self.get_user_by_email(email)
        if not user:
            return {"exists": False}
        
        return {
            "exists": True,
            "is_verified": user.is_verified,
            "has_otp": user.otp_code is not None,
            "otp_created_at": user.otp_created_at,
            "otp_attempts": user.otp_attempts,
            "otp_locked_until": user.otp_locked_until,
            "is_locked": user.otp_locked_until and user.otp_locked_until > datetime.utcnow()
        }