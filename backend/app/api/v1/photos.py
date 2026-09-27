import hashlib
import os
import uuid
from pathlib import Path
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models.event import Event
from app.models.event_member import EventMember
from app.models.photo import Photo
from app.models.user import User
from app.schemas.photo import PhotoRead, PhotoUploadResponse

router = APIRouter(prefix="/events", tags=["Photos"])


async def check_event_membership(event_id: UUID, user_id: UUID, db: AsyncSession) -> Event:
    """Verify that the event exists and the user is either the host or a registered member."""
    # Fetch event
    event_stmt = select(Event).where(Event.id == event_id)
    event_res = await db.execute(event_stmt)
    event = event_res.scalar_one_or_none()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    # Check if host or member
    if event.host_id == user_id:
        return event

    member_stmt = select(EventMember).where(
        EventMember.event_id == event_id,
        EventMember.user_id == user_id,
    )
    member_res = await db.execute(member_stmt)
    is_member = member_res.scalar_one_or_none()
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a member of this event to access or upload photos.",
        )

    return event


def map_photo_to_read(photo: Photo, current_user: User) -> PhotoRead:
    uploader_name = photo.uploader.name if photo.uploader else None
    uploader_email = photo.uploader.email if photo.uploader else None
    is_uploader = photo.uploader_id == current_user.id

    return PhotoRead(
        id=photo.id,
        event_id=photo.event_id,
        uploader_id=photo.uploader_id,
        file_name=photo.file_name,
        file_size=photo.file_size,
        content_type=photo.content_type,
        file_url=photo.file_path,
        file_hash=photo.file_hash,
        processed=photo.processed,
        uploaded_at=photo.uploaded_at,
        uploader_name=uploader_name,
        uploader_email=uploader_email,
        is_uploader=is_uploader,
    )


@router.post("/{event_id}/photos", response_model=PhotoUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    event_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    F5 Photo Upload Acceptance Criteria:
    - Accepts standard image formats (JPEG, PNG, WebP).
    - File size capped at 15MB with clear error.
    - Duplicate photo (same content hash within event) detected.
    - Uploaded photo stored and immediately accessible in gallery.
    """
    await check_event_membership(event_id, current_user.id, db)

    # 1. Format validation
    content_type = file.content_type or ""
    if content_type.lower() not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{content_type}'. Please upload JPEG, PNG, or WebP images.",
        )

    # 2. Read contents and validate size
    contents = await file.read()
    file_size = len(contents)
    if file_size > settings.MAX_PHOTO_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({file_size // (1024 * 1024)}MB) exceeds maximum limit of 15MB.",
        )
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # 3. Compute SHA-256 hash for duplicate detection
    file_hash = hashlib.sha256(contents).hexdigest()

    # Check for duplicate in this event
    dup_stmt = select(Photo).options(selectinload(Photo.uploader)).where(
        Photo.event_id == event_id,
        Photo.file_hash == file_hash,
    )
    dup_res = await db.execute(dup_stmt)
    existing_photo = dup_res.scalar_one_or_none()
    if existing_photo:
        return PhotoUploadResponse(
            message="Photo already uploaded to this event (duplicate detected).",
            photo=map_photo_to_read(existing_photo, current_user),
            is_duplicate=True,
        )

    # 4. Save file to disk
    original_filename = file.filename or "photo.jpg"
    ext = Path(original_filename).suffix.lower()
    if not ext:
        ext = ".jpg" if "jpeg" in content_type else ".png"

    photo_id = uuid.uuid4()
    stored_filename = f"{photo_id}{ext}"
    event_upload_dir = Path(settings.UPLOAD_DIR) / "events" / str(event_id)
    os.makedirs(event_upload_dir, exist_ok=True)

    dest_path = event_upload_dir / stored_filename
    with open(dest_path, "wb") as f:
        f.write(contents)

    relative_url = f"/uploads/events/{event_id}/{stored_filename}"

    # 5. Create photo record
    new_photo = Photo(
        id=photo_id,
        event_id=event_id,
        uploader_id=current_user.id,
        file_path=relative_url,
        file_name=original_filename,
        file_size=file_size,
        content_type=content_type,
        file_hash=file_hash,
        processed=False,
    )
    db.add(new_photo)
    await db.commit()
    await db.refresh(new_photo)

    # Load uploader relationship for response
    new_photo.uploader = current_user

    return PhotoUploadResponse(
        message="Photo uploaded successfully.",
        photo=map_photo_to_read(new_photo, current_user),
        is_duplicate=False,
    )


@router.get("/{event_id}/photos", response_model=List[PhotoRead])
async def get_event_photos(
    event_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all photos for an event gallery (sorted newest first).
    Accessible to event members and host.
    """
    await check_event_membership(event_id, current_user.id, db)

    stmt = (
        select(Photo)
        .options(selectinload(Photo.uploader))
        .where(Photo.event_id == event_id)
        .order_by(Photo.uploaded_at.desc())
    )
    res = await db.execute(stmt)
    photos = res.scalars().all()

    return [map_photo_to_read(p, current_user) for p in photos]


@router.get("/{event_id}/photos/mine", response_model=List[PhotoRead])
async def get_my_photos(
    event_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get photos uploaded by current user in this event (for M2).
    In M3, this will also include face-matched photos.
    """
    await check_event_membership(event_id, current_user.id, db)

    stmt = (
        select(Photo)
        .options(selectinload(Photo.uploader))
        .where(
            Photo.event_id == event_id,
            Photo.uploader_id == current_user.id,
        )
        .order_by(Photo.uploaded_at.desc())
    )
    res = await db.execute(stmt)
    photos = res.scalars().all()

    return [map_photo_to_read(p, current_user) for p in photos]


@router.delete("/{event_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    event_id: UUID,
    photo_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a photo.
    Allowed for the original uploader or the event host.
    """
    event = await check_event_membership(event_id, current_user.id, db)

    stmt = select(Photo).where(Photo.id == photo_id, Photo.event_id == event_id)
    res = await db.execute(stmt)
    photo = res.scalar_one_or_none()
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found.",
        )

    # Permission check: must be uploader or event host
    if photo.uploader_id != current_user.id and event.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own photos or photos from events you host.",
        )

    # Delete local file if it exists
    try:
        clean_rel = photo.file_path.lstrip("/").replace("uploads/", "")
        disk_path = Path(settings.UPLOAD_DIR) / clean_rel
        if disk_path.exists():
            disk_path.unlink()
    except Exception as e:
        print(f"Warning: Failed to delete photo file from disk: {e}")

    await db.delete(photo)
    await db.commit()
