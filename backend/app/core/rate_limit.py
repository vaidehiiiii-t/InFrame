import time
from collections import defaultdict
from fastapi import HTTPException, status
from app.core.config import settings

# In-memory store for join attempts: key -> list of timestamps
_join_attempts = defaultdict(list)


def check_join_rate_limit(identifier: str) -> None:
    """
    Enforces F4 acceptance criteria:
    Max 5 join attempts per hour per user/IP.
    """
    now = time.time()
    window = settings.JOIN_RATE_LIMIT_WINDOW_SECONDS
    max_attempts = settings.JOIN_RATE_LIMIT_ATTEMPTS

    # Filter out timestamps older than the window
    attempts = [t for t in _join_attempts[identifier] if now - t < window]
    _join_attempts[identifier] = attempts

    if len(attempts) >= max_attempts:
        retry_after = int(window - (now - attempts[0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many join attempts. Please try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )

    # Record this attempt
    _join_attempts[identifier].append(now)


def reset_rate_limit(identifier: str) -> None:
    """Utility for resetting rate limit in tests or after successful action if desired."""
    if identifier in _join_attempts:
        del _join_attempts[identifier]
