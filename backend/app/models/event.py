import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Date, DateTime, ForeignKey, Uuid
from sqlalchemy.orm import relationship
from app.models.base import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    host_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    event_date = Column(Date, nullable=False)
    pin_code = Column(String(8), unique=True, nullable=False, index=True)
    retention_days = Column(Integer, nullable=False)
    rekognition_collection_id = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    # Relationships
    host = relationship("User", back_populates="hosted_events")
    members = relationship("EventMember", back_populates="event", cascade="all, delete-orphan")
    photos = relationship("Photo", back_populates="event", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Event {self.name} (PIN: {self.pin_code})>"
