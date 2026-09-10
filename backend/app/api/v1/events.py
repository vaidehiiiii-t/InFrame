import uuid
from datetime import datetime, timedelta, timezone
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_client_identifier, get_current_user, get_db
from app.core.rate_limit import check_join_rate_limit
from app.models.event import Event
from app.models.event_member import EventMember
from app.models.user import User
from app.schemas.event import (
    EventCreate,
    EventDetailResponse,
    EventJoin,
    EventJoinResponse,
    EventMemberResponse,
    EventResponse,
)
from app.utils.pin import generate_unique_pin

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: EventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    F3 Acceptance Criteria:
    - Host must be authenticated.
    - Retention period must be a positive integer <= 180 days.
    - Generates unique, hard-to-guess 8-char PIN.
    - Creates dedicated Rekognition Collection ID format.
    - Computes and stores expires_at.
    - Adds host to event_members.
    """
    event_id = uuid.uuid4()
    pin = await generate_unique_pin(db)
    
    # Calculate expires_at from event_date + retention_days
    event_start = datetime.combine(payload.event_date, datetime.min.time(), tzinfo=timezone.utc)
    expires_at = event_start + timedelta(days=payload.retention_days)

    # Collection ID format for AWS Rekognition (used in M3)
    collection_id = f"eventsnap-event-{event_id}"

    event = Event(
        id=event_id,
        host_id=current_user.id,
        name=payload.name.strip(),
        event_date=payload.event_date,
        pin_code=pin,
        retention_days=payload.retention_days,
        rekognition_collection_id=collection_id,
        expires_at=expires_at,
    )
    db.add(event)

    # Automatically add host as an event member
    host_member = EventMember(
        id=uuid.uuid4(),
        event_id=event_id,
        user_id=current_user.id,
    )
    db.add(host_member)

    await db.commit()
    await db.refresh(event)

    resp = EventResponse.model_validate(event)
    resp.is_host = True
    resp.member_count = 1
    return resp


@router.post("/join", response_model=EventJoinResponse)
async def join_event(
    payload: EventJoin,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    F4 Acceptance Criteria:
    - PIN entry is rate-limited (5 attempts/hour per account/IP).
    - Valid PIN adds user to event_members.
    - Invalid PIN returns generic 'invalid code' error (no hints).
    """
    # Rate limit check
    rate_limit_id = get_client_identifier(request, current_user)
    check_join_rate_limit(rate_limit_id)

    # Find event by PIN
    query = select(Event).where(Event.pin_code == payload.pin_code)
    result = await db.execute(query)
    event = result.scalar_one_or_none()

    generic_error = HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Invalid event PIN code.",
    )

    if not event:
        raise generic_error

    # Check if event has expired
    now = datetime.now(timezone.utc)
    # Ensure expires_at is timezone-aware for comparison
    expires_at = event.expires_at if event.expires_at.tzinfo else event.expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= now:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This event has expired and is no longer accessible.",
        )

    # Check if already a member
    member_query = select(EventMember).where(
        EventMember.event_id == event.id,
        EventMember.user_id == current_user.id,
    )
    member_result = await db.execute(member_query)
    existing_member = member_result.scalar_one_or_none()

    if not existing_member:
        new_member = EventMember(
            id=uuid.uuid4(),
            event_id=event.id,
            user_id=current_user.id,
        )
        db.add(new_member)
        await db.commit()
        message = "Successfully joined the event."
    else:
        message = "You are already a member of this event."

    # Count members
    count_query = select(func.count(EventMember.id)).where(EventMember.event_id == event.id)
    count_result = await db.execute(count_query)
    member_count = count_result.scalar() or 1

    event_resp = EventResponse.model_validate(event)
    event_resp.is_host = (event.host_id == current_user.id)
    event_resp.member_count = member_count

    return EventJoinResponse(
        message=message,
        event=event_resp,
    )


@router.get("", response_model=List[EventResponse])
async def list_user_events(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all events created by or joined by the current user."""
    # Find event IDs where current user is a member or host
    query = (
        select(Event)
        .join(EventMember, EventMember.event_id == Event.id, isouter=True)
        .where(or_(Event.host_id == current_user.id, EventMember.user_id == current_user.id))
        .distinct()
        .order_by(Event.created_at.desc())
    )
    result = await db.execute(query)
    events = result.scalars().all()

    response_list = []
    for event in events:
        # Get member count
        count_query = select(func.count(EventMember.id)).where(EventMember.event_id == event.id)
        count_res = await db.execute(count_query)
        m_count = count_res.scalar() or 0

        item = EventResponse.model_validate(event)
        item.is_host = (event.host_id == current_user.id)
        item.member_count = m_count
        response_list.append(item)

    return response_list


@router.get("/{event_id}", response_model=EventDetailResponse)
async def get_event_detail(
    event_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve detailed event info including host and member list for members/host."""
    query = (
        select(Event)
        .options(
            selectinload(Event.host),
            selectinload(Event.members).selectinload(EventMember.user),
        )
        .where(Event.id == event_id)
    )
    result = await db.execute(query)
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    # Check access: must be host or member
    is_member = any(m.user_id == current_user.id for m in event.members)
    if not is_member and event.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this event.",
        )

    resp = EventDetailResponse.model_validate(event)
    resp.is_host = (event.host_id == current_user.id)
    resp.member_count = len(event.members)
    return resp


@router.get("/{event_id}/members", response_model=List[EventMemberResponse])
async def list_event_members(
    event_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List members of an event."""
    # Verify event exists and caller has access
    event_res = await db.execute(select(Event).where(Event.id == event_id))
    event = event_res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    query = (
        select(EventMember)
        .options(selectinload(EventMember.user))
        .where(EventMember.event_id == event_id)
        .order_by(EventMember.joined_at.asc())
    )
    result = await db.execute(query)
    members = result.scalars().all()

    # Check caller is member
    if not any(m.user_id == current_user.id for m in members) and event.host_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return [EventMemberResponse.model_validate(m) for m in members]


@router.delete("/{event_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_event_member(
    event_id: UUID,
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Host can revoke a guest's access (User story 2)."""
    event_res = await db.execute(select(Event).where(Event.id == event_id))
    event = event_res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    if event.host_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the host can remove members.")

    if user_id == event.host_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Host cannot be removed from their own event.")

    query = select(EventMember).where(
        EventMember.event_id == event_id,
        EventMember.user_id == user_id,
    )
    member_res = await db.execute(query)
    member = member_res.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in this event.")

    await db.delete(member)
    await db.commit()
    return None
