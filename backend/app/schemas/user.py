from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: UUID
    face_registered: bool
    rekognition_face_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
