import json
import os
from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parents[2]
_PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    PROJECT_NAME: str = "EventSnap API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database (defaults to zero-config SQLite for instant local standalone development)
    DATABASE_URL: str = "sqlite+aiosqlite:///./eventsnap.db"
    SYNC_DATABASE_URL: str = ""

    # Security & JWT
    SECRET_KEY: str = "eventsnap_super_secret_jwt_key_change_in_production_987654321"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Business Rules (from Feature Specification)
    PIN_LENGTH: int = 8
    MAX_RETENTION_DAYS: int = 180
    JOIN_RATE_LIMIT_ATTEMPTS: int = 5
    JOIN_RATE_LIMIT_WINDOW_SECONDS: int = 3600  # 1 hour

    # Photo Upload Settings (Milestone 2)
    MAX_PHOTO_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    UPLOAD_DIR: str = str((_BACKEND_DIR / "uploads").resolve())

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def resolve_sqlite_path(cls, v: str) -> str:
        if v.startswith("sqlite+aiosqlite:///") and not v.startswith("sqlite+aiosqlite:///:memory:"):
            raw_path = v[len("sqlite+aiosqlite:///"):]
            if not os.path.isabs(raw_path):
                clean_path = raw_path.lstrip("./").lstrip(".\\")
                abs_db_path = (_PROJECT_ROOT / clean_path).resolve()
                return f"sqlite+aiosqlite:///{abs_db_path.as_posix()}"
        return v

    @field_validator("SYNC_DATABASE_URL", mode="after")
    @classmethod
    def resolve_sync_sqlite_path(cls, v: str) -> str:
        if v and v.startswith("sqlite:///") and not v.startswith("sqlite:///:memory:"):
            raw_path = v[len("sqlite:///"):]
            if not os.path.isabs(raw_path):
                clean_path = raw_path.lstrip("./").lstrip(".\\")
                abs_db_path = (_PROJECT_ROOT / clean_path).resolve()
                return f"sqlite:///{abs_db_path.as_posix()}"
        return v

    @property
    def sync_database_url(self) -> str:
        if self.SYNC_DATABASE_URL:
            return self.SYNC_DATABASE_URL
        if self.DATABASE_URL.startswith("sqlite"):
            return self.DATABASE_URL.replace("sqlite+aiosqlite://", "sqlite://")
        return self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://").replace("postgresql://", "postgresql+psycopg2://")

    model_config = SettingsConfigDict(
        env_file=(
            str(_BACKEND_DIR / ".env"),
            str(_PROJECT_ROOT / ".env"),
            ".env",
            "../.env",
        ),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()
