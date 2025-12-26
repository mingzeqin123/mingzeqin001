# RTX 4080 本地部署：人脸识别 Demo（GPU）

这个目录提供一个**本地可运行的人脸识别 Demo**（检测 + 特征提取 + 相似度比对），优先走 **CUDA GPU（如 RTX 4080）**，不可用时自动走 CPU。

## 环境要求

- **Linux**（Ubuntu/Arch 等均可）
- **NVIDIA 驱动**安装正确（能跑 `nvidia-smi`）
- Python **3.9+**（建议 3.10/3.11）

> 说明：本 Demo 使用 `insightface`（ArcFace 模型）+ `onnxruntime-gpu`。首次运行会自动下载模型到 `~/.insightface/`。

## 安装

建议使用虚拟环境：

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -r face_demo/requirements.txt
```

## 1) 检查 GPU 是否可用

```bash
python face_demo/check_gpu.py --verbose
```

看到 `CUDAExecutionProvider` 即说明 onnxruntime 能用 GPU。

如果没有：

- 先确认 `nvidia-smi` 正常
- 确认你安装的是 `onnxruntime-gpu`（而不是 `onnxruntime`）
- 你的驱动/CUDA 运行时与 onnxruntime-gpu wheel 需要兼容（不同版本组合可能导致 CUDA provider 不出现）

## 2) 图片对图片：人脸验证（是否同一人）

```bash
python face_demo/face_verify.py \
  --id-image /path/to/id.jpg \
  --probe-image /path/to/probe.jpg \
  --device cuda \
  --threshold 0.35
```

输出示例（字段含义）：

- `cosine_similarity`: 两张图中最大脸的特征余弦相似度（越大越像）
- `is_same_person`: 是否超过阈值

阈值经验值：`0.30 ~ 0.45`（越高越严格；不同数据集/场景需要自己校准）。

## 3) 摄像头实时 Demo（可选：带图库识别）

仅检测（不识别姓名）：

```bash
python face_demo/webcam_demo.py --device cuda
```

带图库识别：

1) 准备图库目录（按人名分文件夹）：

```
gallery/
  alice/
    1.jpg
    2.jpg
  bob/
    1.jpg
```

2) 运行：

```bash
python face_demo/webcam_demo.py --device cuda --gallery ./gallery --threshold 0.35
```

窗口里会显示 `name (similarity)`；低于阈值显示 `unknown`。

## 常见问题

### Q1: 运行时报错：模型下载失败

需要网络访问。你也可以把模型文件提前下载后放到 `~/.insightface/models/`（InsightFace 默认路径）。

### Q2: 没有 `CUDAExecutionProvider`

通常是驱动/运行时不匹配导致。优先确认：

- `nvidia-smi` 输出正常，驱动版本足够新（4080 建议较新驱动）
- `python -c "import onnxruntime as ort; print(ort.get_available_providers())"` 看 provider

### Q3: 摄像头打不开

尝试换 index：

```bash
python face_demo/webcam_demo.py --camera 1
```

