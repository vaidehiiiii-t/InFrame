from datetime import date, datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, ConfigDict
from app.schemas.user import UserResponse


class EventCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Name of the event")
    event_date: date = Field(..., description="Date of the event (YYYY-MM-DD)")
    retention_days: int = Field(..., ge=1, le=180, description="Retention period in days (1 to 180)")


class EventJoin(BaseModel):
    pin_code: str = Field(..., min_length=6, max_length=12, description="Event PIN code")

    @field_validator("pin_code")
    @classmethod
    def normalize_pin(cls, v: str) -> str:
        return v.strip().upper()


class EventMemberResponse(BaseModel):
    id: UUID
    user_id: UUID
    joined_at: datetime
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class EventResponse(BaseModel):
    id: UUID
    name: str
    event_date: date
    pin_code: str
    retention_days: int
    rekognition_collection_id: str
    host_id: UUID
    created_at: datetime
    expires_at: datetime
    is_host: Optional[bool] = None
    member_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class EventDetailResponse(EventResponse):
    host: Optional[UserResponse] = None
    members: List[EventMemberResponse] = []

    model_config = ConfigDict(from_attributes=True)


class EventJoinResponse(BaseModel):
    message: str
    event: EventResponse
