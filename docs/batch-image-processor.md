# 批量图片处理脚本使用指南

`batch_image_processor.py` 是一个命令行工具，用于批量执行图片缩放、格式转换、水印添加以及重命名等常见操作。

## 环境要求

- Python 3.9+
- 依赖库：`Pillow`（已在 `requirements.txt` 中列出）

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 快速开始

```bash
python3 batch_image_processor.py <输入路径...> -o <输出目录> [选项...]
```

- 输入路径可以是单个文件、多个文件，或目录（支持多选）。
- 默认只处理常见图片格式（jpg、png、webp 等）；可通过 `--include-ext` 控制。
- 默认输出目录为 `processed-images`，不存在时会自动创建。

## 核心功能

- **缩放**：使用 `--width` / `--height` 指定目标尺寸，`--keep-aspect` 控制是否保持宽高比，`--resample` 指定插值算法。
- **格式转换**：使用 `--format`（如 `png`/`webp`/`jpg`）以及可选的 `--quality`、`--optimize`。
- **文字水印**：`--watermark-text` 搭配 `--watermark-font`、`--watermark-font-size`、`--watermark-color`、`--watermark-opacity`、`--watermark-position`、`--watermark-margin`。
- **图片水印**：`--watermark-image` 搭配 `--watermark-scale`、`--watermark-width`、`--watermark-height`、`--watermark-opacity`、`--watermark-position`、`--watermark-margin`。
  - 文字水印与图片水印互斥，只能选择其中一种。
- **批量重命名**：`--rename-pattern`（支持 `{index}`、`{original_name}` 占位符）与 `--start-index`。
- **安全选项**：`--dry-run` 查看操作计划；`--overwrite` 允许覆盖输出；`--recursive` 递归遍历目录。

## 常用示例

### 1. 按指定尺寸缩放并添加文字水印

```bash
python3 batch_image_processor.py input_dir -o output_resized \
  --width 800 --height 600 --keep-aspect \
  --watermark-text "© Company" --watermark-position bottom-right \
  --rename-pattern "resized_{index:03d}"
```

### 2. 转换格式并添加图片水印

```bash
python3 batch_image_processor.py images --recursive \
  --include-ext jpg,jpeg \
  --format webp --quality 90 \
  --watermark-image assets/logo.png --watermark-scale 0.25 \
  --watermark-opacity 0.6 \
  -o output_webp
```

### 3. 批量重命名并不保存结果（演练）

```bash
python3 batch_image_processor.py photos --dry-run \
  --rename-pattern "album_{index:04d}" \
  --start-index 100
```

## 注意事项

- 当输出格式为 JPEG 且图片含透明通道时，脚本会自动转换为 RGB。
- 使用自定义中文字体时，请通过 `--watermark-font` 指定 `.ttf/.otf` 文件。
- `--watermark-scale` 为相对于原图较短边的比例（0-1），可与 `--watermark-width`/`--watermark-height` 组合。
- 默认在命令行输出处理进度及统计信息，添加 `-v/--verbose` 可查看更多调试日志。

如需进一步定制，可直接编辑 `batch_image_processor.py` 中的逻辑。欢迎在命令行加上 `--help` 查看完整参数说明。
