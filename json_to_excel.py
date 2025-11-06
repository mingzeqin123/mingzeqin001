#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""JSON 转 Excel 工具

将 JSON 数据转换为 Excel (.xlsx) 文件，支持自动展开嵌套字段、指定根键路径等功能。
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Iterable, List

import pandas as pd


class JsonToExcelError(Exception):
    """在 JSON 转换过程中出现的业务异常。"""


def read_json(input_path: Path) -> Any:
    """读取 JSON 文件，兼容标准 JSON 和换行分隔 JSON (NDJSON)。"""

    if not input_path.exists():
        raise JsonToExcelError(f"输入文件不存在: {input_path}")

    try:
        text = input_path.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        raise JsonToExcelError("读取文件失败，请确认文件为 UTF-8 编码") from exc

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # 尝试按行解析（NDJSON）
        records: List[Any] = []
        for line_no, line in enumerate(text.splitlines(), start=1):
            stripped = line.strip()
            if not stripped:
                continue
            try:
                records.append(json.loads(stripped))
            except json.JSONDecodeError as exc:
                raise JsonToExcelError(
                    f"无法解析 JSON: 第 {line_no} 行存在非法 JSON 数据"
                ) from exc

        if not records:
            raise JsonToExcelError("未检测到有效的 JSON 数据")

        return records


def extract_by_root_key(data: Any, root_key: str) -> Any:
    """根据点号分隔的键路径提取嵌套数据。"""

    current = data
    for key in root_key.split("."):
        if isinstance(current, dict) and key in current:
            current = current[key]
        else:
            raise JsonToExcelError(f"根键路径无效，无法找到 '{key}' 字段")
    return current


def ensure_records(data: Any) -> Iterable[Any]:
    """将输入数据统一转为记录列表。"""

    if isinstance(data, list):
        if all(isinstance(item, dict) for item in data):
            return data
        return [{"value": item} for item in data]

    if isinstance(data, dict):
        return [data]

    raise JsonToExcelError("仅支持对象或对象列表的 JSON 数据结构")


def determine_output_path(input_path: Path, output: str | None) -> Path:
    """根据输入和可选输出路径生成最终输出路径。"""

    if output:
        return Path(output).expanduser().resolve()

    return input_path.with_suffix(".xlsx")


def convert_json_to_excel(
    input_file: str,
    output_file: str | None = None,
    sheet_name: str = "Sheet1",
    root_key: str | None = None,
    keep_nested: bool = False,
    na_rep: str = "",
) -> Path:
    """将 JSON 文件转换为 Excel 文件。"""

    input_path = Path(input_file).expanduser().resolve()
    raw_data = read_json(input_path)

    if root_key:
        raw_data = extract_by_root_key(raw_data, root_key)

    records = list(ensure_records(raw_data))

    if not records:
        df = pd.DataFrame()
    else:
        if keep_nested:
            df = pd.DataFrame(records)
        else:
            df = pd.json_normalize(records)

    output_path = determine_output_path(input_path, output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        df.to_excel(
            output_path,
            index=False,
            sheet_name=sheet_name,
            engine="openpyxl",
            na_rep=na_rep,
        )
    except ValueError as exc:
        raise JsonToExcelError(f"写入 Excel 失败: {exc}") from exc

    return output_path


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="将 JSON 文件转换为 Excel (.xlsx) 文件"
    )
    parser.add_argument("input", help="输入 JSON 文件路径")
    parser.add_argument("output", nargs="?", help="输出 Excel 文件路径")
    parser.add_argument(
        "--sheet-name",
        default="Sheet1",
        help="Excel 工作表名称 (默认: Sheet1)",
    )
    parser.add_argument(
        "--root-key",
        help="指定 JSON 中包含数据列表的根键路径，使用点号分隔",
    )
    parser.add_argument(
        "--keep-nested",
        action="store_true",
        help="保留嵌套结构，不展开嵌套字段",
    )
    parser.add_argument(
        "--na-rep",
        default="",
        help="缺失值填充值 (默认: 空字符串)",
    )
    return parser


def main(argv: Iterable[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(list(argv) if argv is not None else None)

    try:
        output_path = convert_json_to_excel(
            input_file=args.input,
            output_file=args.output,
            sheet_name=args.sheet_name,
            root_key=args.root_key,
            keep_nested=args.keep_nested,
            na_rep=args.na_rep,
        )
    except JsonToExcelError as exc:
        print(f"错误: {exc}")
        return 1
    except Exception as exc:  # pragma: no cover - 捕获意外异常用于提示
        print(f"发生未知错误: {exc}")
        return 1

    print(f"转换完成！输出文件: {output_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
