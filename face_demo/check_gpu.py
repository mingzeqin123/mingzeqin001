import argparse


def main() -> int:
    parser = argparse.ArgumentParser(description="Check onnxruntime GPU providers.")
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Print extra environment info.",
    )
    args = parser.parse_args()

    try:
        import onnxruntime as ort
    except Exception as e:  # noqa: BLE001
        print("Failed to import onnxruntime:", repr(e))
        print("Did you install deps?  pip install -r face_demo/requirements.txt")
        return 2

    print("onnxruntime version:", getattr(ort, "__version__", "unknown"))
    providers = ort.get_available_providers()
    print("available providers:", providers)

    if "CUDAExecutionProvider" in providers:
        print("CUDAExecutionProvider detected: GPU should be usable.")
        return 0

    print("CUDAExecutionProvider NOT detected: will run on CPU.")
    if args.verbose:
        print(
            "Notes: you need a working NVIDIA driver + compatible CUDA/cuDNN runtime for your onnxruntime-gpu wheel."
        )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())

