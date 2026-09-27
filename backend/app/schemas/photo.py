import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class PhotoBase(BaseModel):
    file_name: str
    file_size: int
    content_type: str


class PhotoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    uploader_id: uuid.UUID
    file_name: str
    file_size: int
    content_type: str
    file_url: str
    file_hash: str
    processed: bool = False
    uploaded_at: datetime
    uploader_name: Optional[str] = None
    uploader_email: Optional[str] = None
    is_uploader: Optional[bool] = False


class PhotoUploadResponse(BaseModel):
    message: str
    photo: PhotoRead
    is_duplicate: bool = False
