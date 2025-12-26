import argparse
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np


@dataclass(frozen=True)
class KnownPerson:
    name: str
    embedding: np.ndarray  # (512,)


def _cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    a = a.astype(np.float32)
    b = b.astype(np.float32)
    a = a / (np.linalg.norm(a) + 1e-12)
    b = b / (np.linalg.norm(b) + 1e-12)
    return float(np.dot(a, b))


def _build_app(det_size: int, device: str):
    from insightface.app import FaceAnalysis

    providers = None
    if device.lower() in {"cuda", "gpu"}:
        providers = ["CUDAExecutionProvider", "CPUExecutionProvider"]
    elif device.lower() in {"cpu"}:
        providers = ["CPUExecutionProvider"]

    app = FaceAnalysis(name="buffalo_l", providers=providers)
    app.prepare(ctx_id=0 if device.lower() in {"cuda", "gpu"} else -1, det_size=(det_size, det_size))
    return app


def _iter_images(gallery_dir: Path):
    exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
    for p in sorted(gallery_dir.rglob("*")):
        if p.is_file() and p.suffix.lower() in exts:
            yield p


def _load_gallery(app, gallery_dir: Path) -> list[KnownPerson]:
    people: dict[str, list[np.ndarray]] = {}
    for img_path in _iter_images(gallery_dir):
        name = img_path.parent.name
        img = cv2.imread(str(img_path))
        if img is None:
            continue
        faces = app.get(img)
        if not faces:
            continue
        # choose largest face
        areas = []
        for f in faces:
            x1, y1, x2, y2 = f.bbox.astype(np.float32)
            areas.append((x2 - x1) * (y2 - y1))
        f = faces[int(np.argmax(np.array(areas)))]
        emb = np.asarray(f.embedding, dtype=np.float32).reshape(-1)
        people.setdefault(name, []).append(emb)

    known: list[KnownPerson] = []
    for name, embs in people.items():
        m = np.mean(np.stack(embs, axis=0), axis=0)
        known.append(KnownPerson(name=name, embedding=m))
    return known


def _match_face(emb: np.ndarray, known: list[KnownPerson], threshold: float) -> tuple[str, float]:
    if not known:
        return "unknown", 0.0
    best_name = "unknown"
    best_sim = -1.0
    for kp in known:
        sim = _cosine_sim(emb, kp.embedding)
        if sim > best_sim:
            best_sim = sim
            best_name = kp.name
    if best_sim < threshold:
        return "unknown", float(best_sim)
    return best_name, float(best_sim)


def main() -> int:
    parser = argparse.ArgumentParser(description="Webcam face detection/recognition demo (GPU friendly).")
    parser.add_argument("--camera", type=int, default=0, help="OpenCV camera index.")
    parser.add_argument("--device", choices=["cuda", "cpu"], default="cuda", help="Prefer CUDA if available.")
    parser.add_argument("--det-size", type=int, default=640, help="Detector input size (square).")
    parser.add_argument(
        "--gallery",
        default="",
        help="Optional gallery folder. Structure: gallery/<person_name>/*.jpg . If omitted, only detects faces.",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.35,
        help="Cosine similarity threshold for recognition. Typical: 0.30~0.45.",
    )
    args = parser.parse_args()

    try:
        app = _build_app(det_size=args.det_size, device=args.device)
    except Exception as e:  # noqa: BLE001
        print("Failed to initialize FaceAnalysis:", repr(e))
        return 2

    known: list[KnownPerson] = []
    if args.gallery:
        gdir = Path(args.gallery).expanduser().resolve()
        if gdir.exists() and gdir.is_dir():
            known = _load_gallery(app, gdir)
            print(f"Loaded gallery identities: {', '.join([k.name for k in known]) or '(none)'}")
        else:
            print("Gallery path not found or not a directory:", str(gdir))

    cap = cv2.VideoCapture(int(args.camera))
    if not cap.isOpened():
        print("Failed to open camera:", args.camera)
        return 3

    win = "face_demo (press q to quit)"
    while True:
        ok, frame = cap.read()
        if not ok:
            break

        faces = app.get(frame)
        for f in faces:
            x1, y1, x2, y2 = [int(v) for v in f.bbox]
            emb = np.asarray(f.embedding, dtype=np.float32).reshape(-1)
            name, sim = _match_face(emb, known, float(args.threshold))

            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 200, 0), 2)
            label = name if name == "unknown" else f"{name} ({sim:.2f})"
            cv2.putText(
                frame,
                label,
                (x1, max(0, y1 - 8)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 200, 0),
                2,
                cv2.LINE_AA,
            )

        cv2.imshow(win, frame)
        key = cv2.waitKey(1) & 0xFF
        if key in {ord("q"), 27}:
            break

    cap.release()
    cv2.destroyAllWindows()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

