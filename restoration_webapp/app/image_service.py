"""Utility helpers for applying AI-style restoration using Pillow."""

from pathlib import Path
from typing import Callable

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

ProgressCallback = Callable[[float], None]


def apply_restoration_pipeline(
    input_path: Path,
    output_path: Path,
    progress_callback: ProgressCallback | None = None,
) -> None:
    """Apply a lightweight restoration pipeline as a placeholder for AI inference."""

    def emit(progress: float):
        if progress_callback:
            progress_callback(progress)

    emit(5)
    with Image.open(input_path) as img:
        img = img.convert("RGB")
        emit(15)

        # Step 1: remove dust / scratches approximation via filter stack
        cleaned = img.filter(ImageFilter.MedianFilter(size=3)).filter(ImageFilter.ModeFilter(size=3))
        emit(35)

        # Step 2: enhance contrast and color balance
        cleaned = ImageOps.autocontrast(cleaned)
        cleaned = ImageEnhance.Color(cleaned).enhance(1.35)
        emit(55)

        # Step 3: sharpen and upscale slightly to mimic super-resolution
        sharpened = ImageEnhance.Sharpness(cleaned).enhance(1.5)
        emit(75)

        # Optional: slight denoise-smooth to avoid artifacts
        final_image = sharpened.filter(ImageFilter.UnsharpMask(radius=2, percent=120, threshold=3))
        emit(90)

        final_image.save(output_path, format="JPEG", quality=95)
        emit(100)
