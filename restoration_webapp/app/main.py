"""FastAPI application entry point for the AI photo restoration web app."""

from pathlib import Path
from typing import List

from fastapi import (
    BackgroundTasks,
    Depends,
    FastAPI,
    File,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from . import models, schemas
from .auth import create_access_token, get_current_user, get_password_hash, verify_password
from .config import (
    ALLOWED_IMAGE_EXTENSIONS,
    MAX_UPLOAD_SIZE_MB,
    RESULT_DIR,
    STATIC_DIR,
    TEMPLATES_DIR,
    UPLOAD_DIR,
)
from .database import Base, engine, get_db, SessionLocal
from .image_service import apply_restoration_pipeline

app = FastAPI(title="AI Photo Restoration Portal")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def read_index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/api/register", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    user = models.User(username=payload.username, hashed_password=get_password_hash(payload.password))
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username already exists")

    token = create_access_token(user.id)
    return schemas.TokenResponse(access_token=token, username=user.username)


@app.post("/api/login", response_model=schemas.TokenResponse)
def login_user(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(user.id)
    return schemas.TokenResponse(access_token=token, username=user.username)


@app.get("/api/profile")
def profile(current_user: models.User = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "created_at": current_user.created_at}


def _ensure_allowed_file(upload: UploadFile) -> None:
    extension = upload.filename.rsplit(".", 1)[-1].lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {extension}")


async def _persist_upload(upload: UploadFile, destination: Path) -> None:
    contents = await upload.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_UPLOAD_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"File {upload.filename} exceeds {MAX_UPLOAD_SIZE_MB}MB limit")
    destination.write_bytes(contents)


def _update_job(job_id: int, **kwargs):
    session = SessionLocal()
    try:
        job = session.get(models.RestorationJob, job_id)
        if not job:
            return
        for key, value in kwargs.items():
            setattr(job, key, value)
        session.add(job)
        session.commit()
    finally:
        session.close()


def _process_job(job_id: int):
    session = SessionLocal()
    try:
        job = session.get(models.RestorationJob, job_id)
        if not job:
            return
        _update_job(job_id, status="processing", progress=5.0, error_message=None)

        result_path = Path(job.output_path)

        def progress_hook(value: float):
            status_text = "processing" if value < 100 else "completed"
            _update_job(job_id, progress=value, status=status_text)

        try:
            apply_restoration_pipeline(Path(job.input_path), result_path, progress_callback=progress_hook)
        except Exception as exc:  # pylint: disable=broad-except
            _update_job(job_id, status="failed", error_message=str(exc))
            return

        _update_job(job_id, status="completed", progress=100.0)
    finally:
        session.close()


@app.post("/api/photos/upload", response_model=schemas.UploadResponse)
async def upload_photos(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not files:
        raise HTTPException(status_code=400, detail="Please upload at least one image")

    created_jobs: List[schemas.JobResponse] = []

    for upload in files:
        _ensure_allowed_file(upload)
        job = models.RestorationJob(
            user_id=current_user.id,
            original_filename=upload.filename,
            input_path="",
            output_path="",
            status="queued",
            progress=0.0,
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        input_path = UPLOAD_DIR / f"{job.id}_{upload.filename}"
        await _persist_upload(upload, input_path)

        output_path = RESULT_DIR / f"{job.id}_restored.jpg"
        job.input_path = str(input_path)
        job.output_path = str(output_path)
        db.add(job)
        db.commit()
        db.refresh(job)

        background_tasks.add_task(_process_job, job.id)

        created_jobs.append(
            schemas.JobResponse(
                id=job.id,
                original_filename=job.original_filename,
                status=job.status,
                progress=job.progress,
                created_at=job.created_at,
                updated_at=job.updated_at,
                download_url=None,
            )
        )

    return schemas.UploadResponse(message="Jobs queued successfully", jobs=created_jobs)


@app.get("/api/photos/history", response_model=List[schemas.JobResponse])
def get_history(
    limit: int = 20,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    limit = max(1, min(limit, 100))
    jobs = (
        db.query(models.RestorationJob)
        .filter(models.RestorationJob.user_id == current_user.id)
        .order_by(models.RestorationJob.created_at.desc())
        .limit(limit)
        .all()
    )

    result = []
    for job in jobs:
        download_url = f"/api/photos/{job.id}/result" if job.status == "completed" else None
        result.append(
            schemas.JobResponse(
                id=job.id,
                original_filename=job.original_filename,
                status=job.status,
                progress=job.progress,
                created_at=job.created_at,
                updated_at=job.updated_at,
                download_url=download_url,
                error_message=job.error_message,
            )
        )
    return result


@app.get("/api/photos/{job_id}", response_model=schemas.JobResponse)
def get_job(
    job_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.query(models.RestorationJob).filter(
        models.RestorationJob.id == job_id, models.RestorationJob.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    download_url = f"/api/photos/{job.id}/result" if job.status == "completed" else None
    return schemas.JobResponse(
        id=job.id,
        original_filename=job.original_filename,
        status=job.status,
        progress=job.progress,
        created_at=job.created_at,
        updated_at=job.updated_at,
        download_url=download_url,
        error_message=job.error_message,
    )


@app.get("/api/photos/{job_id}/result")
def download_result(
    job_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.query(models.RestorationJob).filter(
        models.RestorationJob.id == job_id, models.RestorationJob.user_id == current_user.id
    ).first()
    if not job or job.status != "completed" or not job.output_path:
        raise HTTPException(status_code=404, detail="Result not available")

    return FileResponse(path=job.output_path, filename=f"{Path(job.original_filename).stem}_restored.jpg")


@app.delete("/api/photos/{job_id}")
def delete_job(
    job_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.query(models.RestorationJob).filter(
        models.RestorationJob.id == job_id, models.RestorationJob.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    input_path, output_path = Path(job.input_path), Path(job.output_path or "")
    db.delete(job)
    db.commit()

    if input_path.exists():
        input_path.unlink()
    if output_path.exists():
        output_path.unlink()

    return JSONResponse({"message": "Job deleted"})
