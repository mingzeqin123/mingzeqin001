#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Scan Python files for missing docstrings.

This is a lightweight checker to help old repos gradually improve documentation.

Rules (pragmatic defaults):
- Module docstring is optional.
- Class docstring is recommended.
- Function/method docstring is recommended for non-trivial public functions.

This script simply reports functions/classes without docstrings.
It does NOT modify files.

Usage:
  python3 scripts/docs/docstring-scan.py [paths...]

Outputs:
  docs/api/python-docstring-missing.md

Exit code:
- 0: ok
- 2: missing docstrings and FAIL_ON_MISSING=1
"""

from __future__ import annotations

import ast
import os
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_TARGETS = ["."]
EXCLUDES = {".git", "node_modules", "java-mac-app/target", "scripts/docs"}


@dataclass
class Missing:
    kind: str
    name: str
    lineno: int


def is_excluded(path: Path) -> bool:
    s = str(path.as_posix())
    return any(ex in s for ex in EXCLUDES)


def iter_py_files(root: Path) -> list[Path]:
    files: list[Path] = []
    if root.is_file() and root.suffix == ".py":
        return [root]
    if not root.exists() or not root.is_dir():
        return []

    for p in root.rglob("*.py"):
        if is_excluded(p):
            continue
        files.append(p)
    return files


def scan_file(file_path: Path) -> list[Missing]:
    try:
        src = file_path.read_text(encoding="utf-8")
    except Exception:
        return []

    try:
        tree = ast.parse(src)
    except SyntaxError:
        return []

    missing: list[Missing] = []

    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            if ast.get_docstring(node) is None:
                missing.append(Missing("function", node.name, node.lineno))
        elif isinstance(node, ast.ClassDef):
            if ast.get_docstring(node) is None:
                missing.append(Missing("class", node.name, node.lineno))
            # methods
            for child in node.body:
                if isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    # Skip dunder methods; they tend to be obvious
                    if child.name.startswith("__") and child.name.endswith("__"):
                        continue
                    if ast.get_docstring(child) is None:
                        missing.append(Missing("method", f"{node.name}.{child.name}", child.lineno))

    return missing


def main() -> int:
    targets = sys.argv[1:] or DEFAULT_TARGETS
    base = Path.cwd()

    py_files: list[Path] = []
    for t in targets:
        p = (base / t).resolve()
        py_files.extend(iter_py_files(p))

    py_files = sorted(set(py_files))

    missing_by_file: dict[Path, list[Missing]] = {}
    for f in py_files:
        m = scan_file(f)
        if m:
            missing_by_file[f] = m

    total_missing = sum(len(v) for v in missing_by_file.values())

    out_dir = base / "docs" / "api"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "python-docstring-missing.md"

    lines: list[str] = []
    lines.append("# Python docstring 缺失报告")
    lines.append("")
    lines.append(f"- 扫描时间：{datetime.now(timezone.utc).isoformat()}")
    lines.append(f"- 缺失项总数：{total_missing}")
    lines.append("")

    for f in sorted(missing_by_file.keys(), key=lambda x: str(x)):
        rel = f.relative_to(base)
        lines.append(f"## {rel}")
        lines.append("")
        for item in sorted(missing_by_file[f], key=lambda x: x.lineno):
            lines.append(f"- L{item.lineno} **{item.kind}** `{item.name}`")
        lines.append("")

    out_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Docstring scan complete. Missing: {total_missing}. Output: {out_path}")

    if os.environ.get("FAIL_ON_MISSING") == "1" and total_missing > 0:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
