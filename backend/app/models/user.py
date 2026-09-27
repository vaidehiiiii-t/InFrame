import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Uuid
from sqlalchemy.orm import relationship
from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    face_registered = Column(Boolean, default=False, nullable=False)
    rekognition_face_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    hosted_events = relationship("Event", back_populates="host", cascade="all, delete-orphan")
    memberships = relationship("EventMember", back_populates="user", cascade="all, delete-orphan")
    uploaded_photos = relationship("Photo", back_populates="uploader", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User {self.email}>"
