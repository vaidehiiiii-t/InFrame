import secrets
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.event import Event

# Alphanumeric characters excluding visually ambiguous ones (0, O, 1, I)
PIN_CHARACTERS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"


def generate_pin(length: int = None) -> str:
    """Generate a cryptographically secure random alphanumeric PIN."""
    pin_len = length or settings.PIN_LENGTH
    return "".join(secrets.choice(PIN_CHARACTERS) for _ in range(pin_len))


async def generate_unique_pin(db: AsyncSession, max_attempts: int = 10) -> str:
    """
    Generate a PIN and verify uniqueness against active events in the database.
    Retries up to max_attempts in the rare event of a collision.
    """
    for _ in range(max_attempts):
        pin = generate_pin(settings.PIN_LENGTH)
        query = select(Event.id).where(Event.pin_code == pin)
        result = await db.execute(query)
        if result.scalar_one_or_none() is None:
            return pin
    raise RuntimeError("Failed to generate a unique event PIN after multiple attempts.")
