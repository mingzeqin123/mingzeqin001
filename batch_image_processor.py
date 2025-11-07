#!/usr/bin/env python3
"""
Batch image processing utility.

Features:
1. Resize images to given dimensions with optional aspect ratio preservation.
2. Convert images to a target format.
3. Add either text or image watermarks in batch.
4. Rename processed files based on a pattern.

Usage examples:

  # Resize to 800x600 (keeping aspect ratio), convert to PNG, add text watermark, and rename sequentially.
  python batch_image_processor.py input_dir -o output_dir \
      --width 800 --height 600 --keep-aspect \
      --format png \
      --watermark-text "Demo Watermark" --watermark-position bottom-right \
      --rename-pattern "processed_{index:03d}"

  # Convert all jpg files recursively to webp with a logo watermark image.
  python batch_image_processor.py input_dir --recursive \
      --include-ext jpg,jpeg \
      --format webp \
      --watermark-image assets/logo.png --watermark-opacity 0.5 \
      --watermark-scale 0.2
"""

from __future__ import annotations

import argparse
import logging
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Sequence, Tuple

from PIL import Image, ImageColor, ImageDraw, ImageFont, ImageOps

DEFAULT_IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tif", ".tiff", ".webp")

POSITION_PRESETS = {
    "top-left": ("left", "top"),
    "top-right": ("right", "top"),
    "bottom-left": ("left", "bottom"),
    "bottom-right": ("right", "bottom"),
    "center": ("center", "center"),
}

RESAMPLE_MAP = {
    "nearest": Image.NEAREST,
    "bilinear": Image.BILINEAR,
    "bicubic": Image.BICUBIC,
    "lanczos": Image.LANCZOS,
}

FORMAT_EXTENSION_MAP = {
    "JPEG": ".jpg",
    "JPG": ".jpg",
    "PNG": ".png",
    "WEBP": ".webp",
    "TIFF": ".tiff",
    "BMP": ".bmp",
    "GIF": ".gif",
    "ICO": ".ico",
}


@dataclass
class ProcessorConfig:
    inputs: Sequence[Path]
    output_dir: Path
    recursive: bool
    include_exts: Sequence[str]
    width: Optional[int]
    height: Optional[int]
    keep_aspect: bool
    resample: int
    format: Optional[str]
    quality: Optional[int]
    optimize: bool
    watermark_text: Optional[str]
    watermark_image: Optional[Path]
    watermark_position: str
    watermark_color: str
    watermark_opacity: float
    watermark_font: Optional[Path]
    watermark_font_size: int
    watermark_margin: int
    watermark_scale: Optional[float]
    watermark_width: Optional[int]
    watermark_height: Optional[int]
    rename_pattern: str
    start_index: int
    dry_run: bool
    overwrite: bool


def parse_args(argv: Optional[Sequence[str]] = None) -> ProcessorConfig:
    parser = argparse.ArgumentParser(
        description="批量处理图片：缩放、格式转换、水印、重命名。",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )

    parser.add_argument(
        "inputs",
        nargs="+",
        help="待处理的图片文件或目录路径（支持多个）。",
    )
    parser.add_argument(
        "-o",
        "--output-dir",
        default="processed-images",
        help="输出目录。",
    )
    parser.add_argument(
        "--recursive",
        action="store_true",
        help="递归遍历输入目录。",
    )
    parser.add_argument(
        "--include-ext",
        help="只处理指定扩展名（逗号分隔，不含点）。示例: jpg,png",
    )
    parser.add_argument(
        "--width",
        type=int,
        help="缩放后的目标宽度（像素）。",
    )
    parser.add_argument(
        "--height",
        type=int,
        help="缩放后的目标高度（像素）。",
    )
    parser.add_argument(
        "--keep-aspect",
        action="store_true",
        help="缩放时保持宽高比（需要 --width 或 --height）。",
    )
    parser.add_argument(
        "--resample",
        choices=sorted(RESAMPLE_MAP.keys()),
        default="lanczos",
        help="缩放算法。",
    )
    parser.add_argument(
        "--format",
        help="转换后的图片格式（如: jpg, png, webp）。",
    )
    parser.add_argument(
        "--quality",
        type=int,
        help="保存质量（针对有损格式，如 JPEG/WebP）。",
    )
    parser.add_argument(
        "--optimize",
        action="store_true",
        help="使用 Pillow 的优化存储（可能增加处理时间）。",
    )
    watermark_group = parser.add_argument_group("水印")
    watermark_group.add_argument(
        "--watermark-text",
        help="文字水印内容。",
    )
    watermark_group.add_argument(
        "--watermark-image",
        type=Path,
        help="图片水印文件路径。",
    )
    watermark_group.add_argument(
        "--watermark-position",
        choices=POSITION_PRESETS.keys(),
        default="bottom-right",
        help="水印位置预设。",
    )
    watermark_group.add_argument(
        "--watermark-color",
        default="#FFFFFF",
        help="文字水印颜色（支持十六进制或 CSS 颜色名）。",
    )
    watermark_group.add_argument(
        "--watermark-opacity",
        type=float,
        default=0.5,
        help="水印透明度，0-1 之间。",
    )
    watermark_group.add_argument(
        "--watermark-font",
        type=Path,
        help="文字水印字体文件（.ttf / .otf）。",
    )
    watermark_group.add_argument(
        "--watermark-font-size",
        type=int,
        default=36,
        help="文字水印字体大小。",
    )
    watermark_group.add_argument(
        "--watermark-margin",
        type=int,
        default=32,
        help="水印距离图片边缘的边距（像素）。",
    )
    watermark_group.add_argument(
        "--watermark-scale",
        type=float,
        help="图片水印相对于原图较短边的比例（0-1）。",
    )
    watermark_group.add_argument(
        "--watermark-width",
        type=int,
        help="图片水印目标宽度（像素）。",
    )
    watermark_group.add_argument(
        "--watermark-height",
        type=int,
        help="图片水印目标高度（像素）。",
    )
    parser.add_argument(
        "--rename-pattern",
        default="{original_name}",
        help=(
            "输出文件重命名模板，支持 {index}（可选格式化，如 {index:03d}）和 "
            "{original_name} 两个占位符。"
        ),
    )
    parser.add_argument(
        "--start-index",
        type=int,
        default=1,
        help="重命名序号起始值。",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="仅输出将执行的操作，不实际写入文件。",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="允许覆盖已存在的输出文件。",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="输出详细日志。",
    )

    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s: %(message)s",
    )

    if args.watermark_text and args.watermark_image:
        parser.error("文字水印 (--watermark-text) 与图片水印 (--watermark-image) 只能选择其中一种。")

    if not args.watermark_text and not args.watermark_image:
        logging.debug("水印功能未启用。")

    if args.watermark_image and not args.watermark_image.exists():
        parser.error(f"水印图片文件不存在: {args.watermark_image}")

    include_exts = (
        tuple(f".{ext.strip().lower()}" for ext in args.include_ext.split(",") if ext.strip())
        if args.include_ext
        else DEFAULT_IMAGE_EXTS
    )

    output_dir = Path(args.output_dir).expanduser().resolve()

    return ProcessorConfig(
        inputs=[Path(p).expanduser().resolve() for p in args.inputs],
        output_dir=output_dir,
        recursive=args.recursive,
        include_exts=include_exts,
        width=args.width,
        height=args.height,
        keep_aspect=args.keep_aspect,
        resample=RESAMPLE_MAP[args.resample],
        format=args.format.upper() if args.format else None,
        quality=args.quality,
        optimize=args.optimize,
        watermark_text=args.watermark_text,
        watermark_image=args.watermark_image.resolve() if args.watermark_image else None,
        watermark_position=args.watermark_position,
        watermark_color=args.watermark_color,
        watermark_opacity=args.watermark_opacity,
        watermark_font=args.watermark_font.resolve() if args.watermark_font else None,
        watermark_font_size=args.watermark_font_size,
        watermark_margin=args.watermark_margin,
        watermark_scale=args.watermark_scale,
        watermark_width=args.watermark_width,
        watermark_height=args.watermark_height,
        rename_pattern=args.rename_pattern,
        start_index=args.start_index,
        dry_run=args.dry_run,
        overwrite=args.overwrite,
    )


def gather_input_images(
    inputs: Sequence[Path],
    recursive: bool,
    include_exts: Sequence[str],
) -> List[Path]:
    image_paths: List[Path] = []
    for input_path in inputs:
        if not input_path.exists():
            logging.warning("输入路径不存在：%s", input_path)
            continue
        if input_path.is_file():
            if input_path.suffix.lower() in include_exts:
                image_paths.append(input_path)
            else:
                logging.debug("忽略非目标扩展名文件：%s", input_path)
        else:
            iterator = input_path.rglob("*") if recursive else input_path.glob("*")
            for item in iterator:
                if item.is_file() and item.suffix.lower() in include_exts:
                    image_paths.append(item.resolve())
    return sorted(image_paths)


def ensure_output_dir(path: Path) -> None:
    if not path.exists():
        logging.debug("创建输出目录：%s", path)
        path.mkdir(parents=True, exist_ok=True)


def resize_image(
    image: Image.Image,
    width: Optional[int],
    height: Optional[int],
    keep_aspect: bool,
    resample: int,
) -> Image.Image:
    if width is None and height is None:
        return image

    original_size = image.size
    target_width = width or original_size[0]
    target_height = height or original_size[1]

    if keep_aspect:
        logging.debug("按比例缩放到最大尺寸 %sx%s", target_width, target_height)
        return ImageOps.contain(image, (target_width, target_height), method=resample)

    logging.debug("直接缩放到尺寸 %sx%s", target_width, target_height)
    return image.resize((target_width, target_height), resample=resample)


def load_font(font_path: Optional[Path], font_size: int) -> ImageFont.ImageFont:
    if font_path:
        try:
            return ImageFont.truetype(str(font_path), font_size)
        except OSError as exc:
            logging.warning("加载字体失败 %s，使用默认字体。错误：%s", font_path, exc)
    return ImageFont.load_default()


def calculate_watermark_position(
    base_size: Tuple[int, int],
    mark_size: Tuple[int, int],
    position: str,
    margin: int,
) -> Tuple[int, int]:
    base_w, base_h = base_size
    mark_w, mark_h = mark_size
    horz, vert = POSITION_PRESETS[position]

    if horz == "left":
        x = margin
    elif horz == "right":
        x = base_w - mark_w - margin
    else:  # center
        x = (base_w - mark_w) // 2

    if vert == "top":
        y = margin
    elif vert == "bottom":
        y = base_h - mark_h - margin
    else:  # center
        y = (base_h - mark_h) // 2

    return x, y


def apply_text_watermark(
    image: Image.Image,
    text: str,
    position: str,
    color: str,
    opacity: float,
    font_path: Optional[Path],
    font_size: int,
    margin: int,
) -> Image.Image:
    if not text:
        return image

    logging.debug("应用文字水印：%s", text)
    watermark_layer = Image.new("RGBA", image.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(watermark_layer)
    font = load_font(font_path, font_size)

    try:
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
    except AttributeError:
        text_width, text_height = draw.textsize(text, font=font)

    x, y = calculate_watermark_position(image.size, (text_width, text_height), position, margin)
    rgba_color = ImageColor.getrgb(color) + (int(opacity * 255),)
    draw.text((x, y), text, font=font, fill=rgba_color)
    combined = Image.alpha_composite(image.convert("RGBA"), watermark_layer)
    return combined.convert(image.mode)


def apply_image_watermark(
    image: Image.Image,
    watermark_path: Path,
    position: str,
    opacity: float,
    scale: Optional[float],
    target_width: Optional[int],
    target_height: Optional[int],
    margin: int,
) -> Image.Image:
    logging.debug("应用图片水印：%s", watermark_path)
    watermark = Image.open(watermark_path).convert("RGBA")

    base_width, base_height = image.size
    wm_width, wm_height = watermark.size

    if scale:
        if not 0 < scale <= 1:
            raise ValueError("--watermark-scale 需要在 0-1 范围内。")
        shorter_side = min(base_width, base_height)
        new_size = int(shorter_side * scale)
        ratio = wm_width / wm_height
        if ratio >= 1:
            wm_width = new_size
            wm_height = int(new_size / ratio)
        else:
            wm_height = new_size
            wm_width = int(new_size * ratio)
    if target_width:
        wm_width = target_width
        if not target_height:
            wm_height = int(watermark.size[1] * (target_width / watermark.size[0]))
    if target_height:
        wm_height = target_height
        if not target_width:
            wm_width = int(watermark.size[0] * (target_height / watermark.size[1]))

    if (wm_width, wm_height) != watermark.size:
        watermark = watermark.resize((wm_width, wm_height), resample=Image.LANCZOS)

    if opacity < 1:
        alpha = watermark.split()[3]
        alpha = alpha.point(lambda p: int(p * opacity))
        watermark.putalpha(alpha)

    watermark_layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    x, y = calculate_watermark_position(image.size, watermark.size, position, margin)
    watermark_layer.paste(watermark, (x, y), watermark)
    combined = Image.alpha_composite(image.convert("RGBA"), watermark_layer)
    return combined.convert(image.mode)


def determine_output_name(
    pattern: str,
    index: int,
    original_stem: str,
    extension: str,
) -> str:
    try:
        name = pattern.format(index=index, original_name=original_stem)
    except Exception as exc:  # pylint: disable=broad-except
        logging.warning("重命名模板应用失败，回退到原始名称。错误：%s", exc)
        name = original_stem
    return f"{name}{extension}"


def determine_output_extension(target_format: Optional[str], image: Image.Image, source_path: Path) -> str:
    if target_format:
        ext = FORMAT_EXTENSION_MAP.get(target_format.upper())
        if ext:
            return ext
        logging.debug("未知格式 %s，使用默认扩展名 .%s", target_format, target_format.lower())
        return f".{target_format.lower()}"
    if source_path.suffix:
        return source_path.suffix
    if image.format:
        return FORMAT_EXTENSION_MAP.get(image.format.upper(), f".{image.format.lower()}")
    return ".png"


def determine_save_params(
    target_format: Optional[str],
    quality: Optional[int],
    optimize: bool,
) -> dict:
    params = {}
    if target_format:
        params["format"] = target_format.upper()
    if quality is not None:
        params["quality"] = quality
    if optimize:
        params["optimize"] = True
    if target_format and target_format.upper() in {"JPEG", "JPG"}:
        params.setdefault("progressive", True)
    return params


def process_single_image(
    image_path: Path,
    config: ProcessorConfig,
    index: int,
) -> Optional[Path]:
    logging.info("处理文件 (%s): %s", index, image_path)
    with Image.open(image_path) as img:
        image = img.copy()

    original_mode = image.mode

    if config.width or config.height:
        image = resize_image(image, config.width, config.height, config.keep_aspect, config.resample)

    if config.watermark_text:
        image = apply_text_watermark(
            image,
            config.watermark_text,
            config.watermark_position,
            config.watermark_color,
            config.watermark_opacity,
            config.watermark_font,
            config.watermark_font_size,
            config.watermark_margin,
        )
    elif config.watermark_image:
        image = apply_image_watermark(
            image,
            config.watermark_image,
            config.watermark_position,
            config.watermark_opacity,
            config.watermark_scale,
            config.watermark_width,
            config.watermark_height,
            config.watermark_margin,
        )

    if config.format and config.format.upper() in {"JPEG", "JPG"} and image.mode in {"RGBA", "LA"}:
        logging.debug("将带透明度的图片转换为 RGB 以保存为 JPEG。")
        image = image.convert("RGB")
    elif config.format is None and original_mode != image.mode and image.mode == "RGBA":
        logging.debug("保持原始透明度，保存为 PNG。")

    extension = determine_output_extension(config.format, image, image_path)
    output_filename = determine_output_name(config.rename_pattern, index, image_path.stem, extension)
    output_path = config.output_dir / output_filename

    if output_path.exists() and not config.overwrite:
        logging.warning("输出文件已存在，跳过：%s", output_path)
        return None

    save_params = determine_save_params(config.format, config.quality, config.optimize)
    if config.dry_run:
        logging.info("[Dry-Run] 将保存到：%s", output_path)
        return output_path

    ensure_output_dir(config.output_dir)
    image.save(output_path, **save_params)
    logging.info("保存完成：%s", output_path)
    return output_path


def process_images(config: ProcessorConfig) -> None:
    image_paths = gather_input_images(config.inputs, config.recursive, config.include_exts)
    if not image_paths:
        logging.error("未找到需要处理的图片，请检查输入路径和扩展名过滤设置。")
        return

    logging.info("共找到 %s 张图片。输出目录：%s", len(image_paths), config.output_dir)

    processed = 0
    skipped = 0
    failed = 0

    for offset, image_path in enumerate(image_paths):
        index = config.start_index + offset
        try:
            output = process_single_image(image_path, config, index)
            if output is None:
                skipped += 1
            else:
                processed += 1
        except Exception as exc:  # pylint: disable=broad-except
            failed += 1
            logging.exception("处理失败：%s", exc)

    logging.info(
        "处理完成：成功 %s，跳过 %s，失败 %s。",
        processed,
        skipped,
        failed,
    )


def main(argv: Optional[Sequence[str]] = None) -> int:
    config = parse_args(argv)
    try:
        process_images(config)
    except KeyboardInterrupt:
        logging.warning("操作被用户中断。")
        return 130
    return 0


if __name__ == "__main__":
    sys.exit(main())
