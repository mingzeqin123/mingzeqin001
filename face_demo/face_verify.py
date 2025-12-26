import argparse
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np


@dataclass(frozen=True)
class FacePick:
    bbox: np.ndarray  # [x1,y1,x2,y2]
    embedding: np.ndarray  # (512,)


def _cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    a = a.astype(np.float32)
    b = b.astype(np.float32)
    a = a / (np.linalg.norm(a) + 1e-12)
    b = b / (np.linalg.norm(b) + 1e-12)
    return float(np.dot(a, b))


def _read_bgr(image_path: Path) -> np.ndarray:
    img = cv2.imread(str(image_path))
    if img is None:
        raise FileNotFoundError(f"Failed to read image: {image_path}")
    return img


def _pick_largest_face(faces) -> FacePick:
    if not faces:
        raise ValueError("No face detected.")
    areas = []
    for f in faces:
        x1, y1, x2, y2 = f.bbox.astype(np.float32)
        areas.append((x2 - x1) * (y2 - y1))
    idx = int(np.argmax(np.array(areas)))
    f = faces[idx]
    emb = np.asarray(f.embedding, dtype=np.float32).reshape(-1)
    return FacePick(bbox=np.asarray(f.bbox), embedding=emb)


def _build_app(det_size: int, device: str):
    # InsightFace will auto-download models on first run into ~/.insightface/
    from insightface.app import FaceAnalysis

    providers = None
    if device.lower() in {"cuda", "gpu"}:
        providers = ["CUDAExecutionProvider", "CPUExecutionProvider"]
    elif device.lower() in {"cpu"}:
        providers = ["CPUExecutionProvider"]

    app = FaceAnalysis(
        name="buffalo_l",
        providers=providers,
    )
    app.prepare(ctx_id=0 if device.lower() in {"cuda", "gpu"} else -1, det_size=(det_size, det_size))
    return app


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Face verification demo (GPU friendly) using InsightFace + onnxruntime."
    )
    parser.add_argument("--id-image", required=True, help="Reference image path (known identity).")
    parser.add_argument("--probe-image", required=True, help="Probe image path (to verify).")
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.35,
        help="Cosine similarity threshold. Higher = stricter. Typical: 0.30~0.45.",
    )
    parser.add_argument(
        "--device",
        choices=["cuda", "cpu"],
        default="cuda",
        help="Prefer CUDA if available; falls back to CPU if provider missing.",
    )
    parser.add_argument(
        "--det-size",
        type=int,
        default=640,
        help="Detector input size (square). Larger = better small faces, slower.",
    )
    args = parser.parse_args()

    id_path = Path(args.id_image).expanduser().resolve()
    probe_path = Path(args.probe_image).expanduser().resolve()

    # Build model
    try:
        app = _build_app(det_size=args.det_size, device=args.device)
    except Exception as e:  # noqa: BLE001
        print("Failed to initialize FaceAnalysis:", repr(e))
        return 2

    # Load images and infer
    id_img = _read_bgr(id_path)
    probe_img = _read_bgr(probe_path)

    id_faces = app.get(id_img)
    probe_faces = app.get(probe_img)

    try:
        id_face = _pick_largest_face(id_faces)
        probe_face = _pick_largest_face(probe_faces)
    except Exception as e:  # noqa: BLE001
        print("Face detection failed:", repr(e))
        return 3

    sim = _cosine_sim(id_face.embedding, probe_face.embedding)
    same = sim >= float(args.threshold)

    print("id_image:", str(id_path))
    print("probe_image:", str(probe_path))
    print("cosine_similarity:", f"{sim:.4f}")
    print("threshold:", f"{float(args.threshold):.4f}")
    print("is_same_person:", "YES" if same else "NO")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

