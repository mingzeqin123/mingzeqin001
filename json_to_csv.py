#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
JSON 转 CSV 工具

支持：
- 顶层为数组: [{...}, {...}]
- 顶层为对象: {...}（输出单行），或用 --root 指定其中某个字段为数组
- 嵌套字段扁平化（默认开启）：{"a":{"b":1}} -> 列 a.b
- 列表字段处理：
  - join: 基础类型列表用分隔符拼接；复杂列表转 JSON 字符串
  - json: 全部列表/对象直接转 JSON 字符串
  - index: 列表按下标展开为 key[0] / key[1]...
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple


def _is_scalar(value: Any) -> bool:
    return value is None or isinstance(value, (str, int, float, bool))


def _json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), default=str)


def _get_by_root_path(data: Any, root: str) -> Any:
    """
    通过简单 dot 路径取子树：a.b.c
    - 如果某段是纯数字，会当作列表下标
    """
    if not root:
        return data
    cur = data
    for part in root.split("."):
        if part == "":
            continue
        if isinstance(cur, list) and part.isdigit():
            idx = int(part)
            cur = cur[idx]
            continue
        if isinstance(cur, dict):
            if part not in cur:
                raise KeyError(f"root 路径不存在: {root}（缺少键: {part}）")
            cur = cur[part]
            continue
        raise TypeError(f"root 路径 {root} 无法继续下钻（当前类型: {type(cur).__name__}）")
    return cur


def _flatten(
    obj: Any,
    *,
    parent_key: str = "",
    sep: str = ".",
    list_mode: str = "join",
    join_delim: str = ";",
) -> Dict[str, Any]:
    """
    将 dict/list 扁平化为 {key: value}，key 使用 sep 连接。
    list_mode:
      - join: [1,2] -> "1;2"，复杂元素 -> JSON 字符串
      - json: list/dict 直接 JSON 字符串
      - index: list 展开为 key[0], key[1]...
    """
    out: Dict[str, Any] = {}

    def emit(key: str, value: Any) -> None:
        out[key] = value

    def walk(value: Any, key: str) -> None:
        if _is_scalar(value):
            emit(key, value)
            return

        if isinstance(value, dict):
            if list_mode == "json":
                emit(key, _json_dumps(value))
                return
            for k, v in value.items():
                next_key = f"{key}{sep}{k}" if key else str(k)
                walk(v, next_key)
            return

        if isinstance(value, list):
            if list_mode == "json":
                emit(key, _json_dumps(value))
                return

            if list_mode == "index":
                if not value:
                    emit(key, "")
                    return
                for i, v in enumerate(value):
                    next_key = f"{key}[{i}]" if key else f"[{i}]"
                    walk(v, next_key)
                return

            # list_mode == "join"
            if not value:
                emit(key, "")
                return
            if all(_is_scalar(v) for v in value):
                emit(key, join_delim.join("" if v is None else str(v) for v in value))
                return
            emit(key, _json_dumps(value))
            return

        # 兜底：未知类型转字符串
        emit(key, str(value))

    walk(obj, parent_key)
    return out


def _normalize_rows(
    data: Any,
    *,
    root: str,
    flatten: bool,
    sep: str,
    list_mode: str,
    join_delim: str,
) -> List[Dict[str, Any]]:
    data = _get_by_root_path(data, root)

    # 顶层是数组 -> 多行；顶层是对象 -> 单行
    if isinstance(data, list):
        rows_raw = data
    else:
        rows_raw = [data]

    rows: List[Dict[str, Any]] = []
    for item in rows_raw:
        if isinstance(item, dict):
            row_obj: Dict[str, Any] = item
        else:
            row_obj = {"value": item}

        if flatten:
            rows.append(
                _flatten(
                    row_obj,
                    sep=sep,
                    list_mode=list_mode,
                    join_delim=join_delim,
                )
            )
        else:
            # 不扁平化时，非标量字段直接 JSON 字符串化，保证 CSV 是一层
            normalized: Dict[str, Any] = {}
            for k, v in row_obj.items():
                normalized[k] = v if _is_scalar(v) else _json_dumps(v)
            rows.append(normalized)

    return rows


def _collect_columns(rows: Sequence[Dict[str, Any]]) -> List[str]:
    cols: List[str] = []
    seen = set()
    for row in rows:
        for k in row.keys():
            if k not in seen:
                seen.add(k)
                cols.append(k)
    return cols


def json_to_csv(
    input_path: str,
    output_path: Optional[str] = None,
    *,
    root: str = "",
    flatten: bool = True,
    sep: str = ".",
    list_mode: str = "join",
    join_delim: str = ";",
    delimiter: str = ",",
    encoding: str = "utf-8-sig",
) -> str:
    """
    将 JSON 文件转换为 CSV。
    input_path/output_path 支持 "-" 表示 stdin/stdout。
    返回输出文件路径（若输出到 stdout，则返回 "-"）。
    """
    if delimiter == "\\t":
        delimiter = "\t"

    # 读取 JSON
    if input_path == "-":
        raw = sys.stdin.read()
        data = json.loads(raw)
        input_for_default_name = None
    else:
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"输入文件不存在: {input_path}")
        with open(input_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        input_for_default_name = Path(input_path)

    rows = _normalize_rows(
        data,
        root=root,
        flatten=flatten,
        sep=sep,
        list_mode=list_mode,
        join_delim=join_delim,
    )
    cols = _collect_columns(rows)

    # 默认输出文件名
    if output_path is None:
        if input_for_default_name is None:
            output_path = "-"
        else:
            output_path = str(input_for_default_name.with_suffix(".csv"))

    # 写 CSV
    if output_path == "-":
        out_f = sys.stdout
        writer = csv.DictWriter(out_f, fieldnames=cols, delimiter=delimiter, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({k: ("" if v is None else v) for k, v in row.items()})
        return "-"

    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding=encoding, newline="") as f:
        writer = csv.DictWriter(f, fieldnames=cols, delimiter=delimiter, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({k: ("" if v is None else v) for k, v in row.items()})

    return str(out_file)


def main() -> None:
    parser = argparse.ArgumentParser(description="文字格式转化：JSON 转 CSV")
    parser.add_argument("input", help="输入 JSON 文件路径；用 - 表示从 stdin 读取")
    parser.add_argument("output", nargs="?", default=None, help="输出 CSV 路径；用 - 表示输出到 stdout（默认：同名 .csv）")
    parser.add_argument("--root", default="", help="指定 JSON 内部作为表格根的路径（dot 形式，如 data.items）")
    parser.add_argument("--no-flatten", action="store_true", help="不扁平化嵌套字段（非标量自动转 JSON 字符串）")
    parser.add_argument("--sep", default=".", help="扁平化 key 的连接符（默认 .）")
    parser.add_argument(
        "--list-mode",
        choices=["join", "json", "index"],
        default="join",
        help="列表字段处理方式：join/json/index（默认 join）",
    )
    parser.add_argument("--join-delim", default=";", help="list-mode=join 时的拼接分隔符（默认 ;）")
    parser.add_argument("--delimiter", default=",", help=r"CSV 分隔符，默认 ,；传入 \t 表示制表符")
    parser.add_argument(
        "--encoding",
        default="utf-8-sig",
        help="输出编码（默认 utf-8-sig，方便 Excel 直接打开不乱码）",
    )

    args = parser.parse_args()

    try:
        out = json_to_csv(
            args.input,
            args.output,
            root=args.root,
            flatten=not args.no_flatten,
            sep=args.sep,
            list_mode=args.list_mode,
            join_delim=args.join_delim,
            delimiter=args.delimiter,
            encoding=args.encoding,
        )
        if out == "-":
            return
        print(f"转换完成！输出文件: {out}")
    except Exception as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

