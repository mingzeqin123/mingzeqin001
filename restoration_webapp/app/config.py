"""Configuration settings for the restoration web application."""

from pathlib import Path
import os

PROJECT_ROOT = Path(__file__).resolve().parent.parent
STORAGE_DIR = PROJECT_ROOT / "storage"
UPLOAD_DIR = STORAGE_DIR / "uploads"
RESULT_DIR = STORAGE_DIR / "results"
FRONTEND_DIR = PROJECT_ROOT / "frontend"
TEMPLATES_DIR = FRONTEND_DIR / "templates"
STATIC_DIR = FRONTEND_DIR / "static"

for path in (UPLOAD_DIR, RESULT_DIR):
    path.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("RESTORATION_DATABASE_URL", f"sqlite:///{PROJECT_ROOT / 'restoration.db'}")
SECRET_KEY = os.getenv("RESTORATION_SECRET_KEY", "change-me")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("RESTORATION_ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
JWT_ALGORITHM = "HS256"

# Limits
MAX_UPLOAD_SIZE_MB = int(os.getenv("RESTORATION_MAX_UPLOAD_MB", "15"))
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "bmp", "tiff"}
