from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

class UserModel(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    name: str
    password: str  # Hashed password
    profile: Dict[str, Any] = {}
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    profile: Dict[str, Any] = {}

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    profile: Dict[str, Any]
    created_at: datetime