from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, SignupRequest, TokenResponse
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)):
    """
    F1 Acceptance Criteria:
    - User signs up with email, password, name.
    - Duplicate email is rejected with a clear error.
    - Password is hashed (bcrypt) before storage.
    - Returns JWT token.
    """
    # Check for existing email
    query = select(User).where(User.email == payload.email.lower())
    result = await db.execute(query)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    # Hash password and create user
    hashed_pwd = get_password_hash(payload.password)
    user = User(
        email=payload.email.lower(),
        name=payload.name.strip(),
        password_hash=hashed_pwd,
        face_registered=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Issue JWT token
    access_token = create_access_token(subject=str(user.id))
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    F1 Acceptance Criteria:
    - Login returns JWT valid for defined session length.
    - Invalid credentials return generic error (no 'email exists' leakage).
    """
    generic_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    query = select(User).where(User.email == payload.email.lower())
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise generic_error

    if not verify_password(payload.password, user.password_hash):
        raise generic_error

    access_token = create_access_token(subject=str(user.id))
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the profile of the currently authenticated user."""
    return UserResponse.model_validate(current_user)
