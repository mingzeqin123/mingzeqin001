"""Pydantic schemas for API requests and responses."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


class JobResponse(BaseModel):
    id: int
    original_filename: str
    status: str
    progress: float
    created_at: datetime
    updated_at: datetime
    download_url: Optional[str] = None
    error_message: Optional[str] = None

    class Config:
        orm_mode = True


class UploadResponse(BaseModel):
    message: str
    jobs: List[JobResponse]
