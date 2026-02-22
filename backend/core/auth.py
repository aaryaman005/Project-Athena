"""
Project Athena - Authentication Module
Handles password hashing and user persistence.
"""
import os
import json
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from typing import Optional, Dict
import config

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthManager:
    def __init__(self, db_path: str = "users.json"):
        self.db_path = db_path
        self._users = self._load_users()

    def _load_users(self) -> Dict[str, dict]:
        if os.path.exists(self.db_path):
            with open(self.db_path, 'r') as f:
                return json.load(f)
        return {}

    def _save_users(self):
        with open(self.db_path, 'w') as f:
            json.dump(self._users, f, indent=4)

    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    def create_user(self, username: str, password: str, role: str = "analyst"):
        if username in self._users:
            return False
        
        self._users[username] = {
            "username": username,
            "hashed_password": self.hash_password(password),
            "role": role
        }
        self._save_users()
        return True

    def get_user(self, username: str) -> Optional[dict]:
        return self._users.get(username)

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)
        return encoded_jwt

    def verify_token(self, token: str) -> Optional[dict]:
        try:
            payload = jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])
            return payload
        except jwt.PyJWTError:
            return None

# Singleton instance
auth_manager = AuthManager()

# Initialize with a default admin user if none exists
if not auth_manager.get_user("admin"):
    auth_manager.create_user("admin", "athena-admin-2026", role="admin")
