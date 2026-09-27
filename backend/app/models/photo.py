import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Uuid
from sqlalchemy.orm import relationship
from app.models.base import Base


class Photo(Base):
    __tablename__ = "photos"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    event_id = Column(Uuid, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    uploader_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_path = Column(String(512), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    content_type = Column(String(100), nullable=False)
    file_hash = Column(String(64), nullable=False, index=True)  # SHA-256 for duplicate detection
    processed = Column(Boolean, default=False, nullable=False)  # For M3 face processing
    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    event = relationship("Event", back_populates="photos")
    uploader = relationship("User", back_populates="uploaded_photos")

    def __repr__(self) -> str:
        return f"<Photo {self.file_name} event={self.event_id} hash={self.file_hash[:8]}>"
