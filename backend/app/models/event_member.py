import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint, Uuid
from sqlalchemy.orm import relationship
from app.models.base import Base


class EventMember(Base):
    __tablename__ = "event_members"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    event_id = Column(Uuid, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    joined_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_members_event_user"),
    )

    # Relationships
    event = relationship("Event", back_populates="members")
    user = relationship("User", back_populates="memberships")

    def __repr__(self) -> str:
        return f"<EventMember event={self.event_id} user={self.user_id}>"
