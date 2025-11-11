#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量文件转换工具

支持以下能力：
1. 导入多个文件或整个目录
2. 可选地对数据进行行列转置
3. 转换并导出为指定格式 (xlsx / csv / json)
4. 自定义输出目录、文件后缀、是否保留索引/表头等选项
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional, Sequence, Tuple

import pandas as pd

# --------- 常量配置 ---------
SUPPORTED_INPUT_SUFFIXES = {
    ".xlsx",
    ".xls",
    ".xlsm",
    ".csv",
    ".json",
}

SUPPORTED_OUTPUT_FORMATS = {"xlsx", "csv", "json"}

DEFAULT_PATTERN = "*.xlsx"


# --------- 数据结构 ---------
@dataclass
class ConversionResult:
    source: Path
    destination: Optional[Path]
    success: bool
    message: str = ""


# --------- 工具函数 ---------
def parse_arguments(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="导入批量文件，将文件转换成指定格式（支持行列转置）。",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "inputs",
        nargs="+",
        help="输入文件或目录；若最后一个参数是欲输出的文件名且文件不存在，将自动识别为输出文件（单文件模式）。",
    )
    parser.add_argument(
        "-o",
        "--output",
        help="单文件模式下的输出文件路径。当输入仅包含一个文件时生效。",
    )
    parser.add_argument(
        "-O",
        "--output-dir",
        help="批量模式下的输出目录。默认为输入文件所在目录。",
    )
    parser.add_argument(
        "-f",
        "--format",
        choices=sorted(SUPPORTED_OUTPUT_FORMATS),
        default="xlsx",
        help="输出文件格式。",
    )
    parser.add_argument(
        "-p",
        "--pattern",
        default=DEFAULT_PATTERN,
        help="当输入为目录时用于匹配文件的通配符模式，可用逗号分隔多个模式。",
    )
    parser.add_argument(
        "--transpose",
        dest="transpose",
        action="store_true",
        default=True,
        help="对数据进行行列转置（默认开启）。",
    )
    parser.add_argument(
        "--no-transpose",
        dest="transpose",
        action="store_false",
        help="禁用行列转置。",
    )
    parser.add_argument(
        "--include-index",
        dest="include_index",
        action="store_true",
        default=True,
        help="输出时保留索引。",
    )
    parser.add_argument(
        "--no-index",
        dest="include_index",
        action="store_false",
        help="输出时不保留索引。",
    )
    parser.add_argument(
        "--include-header",
        dest="include_header",
        action="store_true",
        default=True,
        help="输出时包含表头。",
    )
    parser.add_argument(
        "--no-header",
        dest="include_header",
        action="store_false",
        help="输出时去除表头（json 输出仍会包含字段名）。",
    )
    parser.add_argument(
        "--suffix",
        help="批量模式下追加到文件名的自定义后缀。默认会根据是否转置自动生成 `_transposed` 或 `_converted`。",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="允许覆盖已存在的输出文件。",
    )
    parser.add_argument(
        "-r",
        "--recursive",
        action="store_true",
        help="在目录模式下递归查找子目录。",
    )

    args = parser.parse_args(argv)

    # 兼容旧命令：python excel_transpose.py input.xlsx output.xlsx
    if args.output is None and len(args.inputs) >= 2:
        potential_output = Path(args.inputs[-1])
        possible_inputs = args.inputs[:-1]
        if len(possible_inputs) == 1:
            first_input_path = Path(possible_inputs[0])
            if (
                not potential_output.exists()
                and first_input_path.exists()
                and first_input_path.is_file()
            ):
                args.output = str(potential_output)
                args.inputs = possible_inputs

    if args.output and len(args.inputs) != 1:
        parser.error("--output 仅能在输入单个文件时使用。")

    return args


def normalize_patterns(patterns: str) -> List[str]:
    return [p.strip() for p in patterns.split(",") if p.strip()]


def gather_input_files(
    inputs: Iterable[str],
    patterns: Sequence[str],
    recursive: bool,
) -> Tuple[List[Path], List[str]]:
    files: List[Path] = []
    warnings: List[str] = []

    for item in inputs:
        path = Path(item).expanduser().resolve()
        if path.is_dir():
            matched = set()
            for pattern in patterns:
                iterator = path.rglob(pattern) if recursive else path.glob(pattern)
                for candidate in iterator:
                    if candidate.is_file():
                        matched.add(candidate.resolve())
            filtered = [
                candidate
                for candidate in matched
                if candidate.suffix.lower() in SUPPORTED_INPUT_SUFFIXES
            ]
            if not filtered:
                warnings.append(f"目录 {path} 中未找到匹配的文件。")
            else:
                files.extend(filtered)
        elif path.is_file():
            if path.suffix.lower() not in SUPPORTED_INPUT_SUFFIXES:
                warnings.append(
                    f"文件 {path} 的扩展名不受支持（支持: {', '.join(sorted(SUPPORTED_INPUT_SUFFIXES))}）。"
                )
            else:
                files.append(path)
        else:
            warnings.append(f"未找到路径: {path}")

    # 去除重复并按名称排序
    unique_files = sorted(set(files))
    return unique_files, warnings


def load_dataframe(path: Path) -> pd.DataFrame:
    suffix = path.suffix.lower()
    if suffix in {".xlsx", ".xls", ".xlsm"}:
        return pd.read_excel(path)
    if suffix == ".csv":
        return pd.read_csv(path)
    if suffix == ".json":
        return pd.read_json(path)
    raise ValueError(f"暂不支持的文件类型: {suffix}")


def determine_output_path(
    source: Path,
    output_dir: Optional[Path],
    output_format: str,
    suffix: Optional[str],
    transpose: bool,
) -> Path:
    target_dir = output_dir or source.parent
    target_dir.mkdir(parents=True, exist_ok=True)

    if suffix is None:
        suffix = "_transposed" if transpose else "_converted"
    if suffix and not suffix.startswith(("_", "-", ".")):
        suffix = f"_{suffix}"

    return target_dir / f"{source.stem}{suffix}.{output_format}"


def save_dataframe(
    df: pd.DataFrame,
    path: Path,
    output_format: str,
    include_index: bool,
    include_header: bool,
) -> None:
    if output_format == "xlsx":
        df.to_excel(
            path,
            index=include_index,
            header=include_header,
            engine="openpyxl",
        )
    elif output_format == "csv":
        df.to_csv(
            path,
            index=include_index,
            header=include_header,
            encoding="utf-8-sig",
        )
    elif output_format == "json":
        if include_index:
            index_name = df.index.name or "index"
            json_df = df.reset_index()
            if index_name != "index":
                json_df = json_df.rename(columns={"index": index_name})
        else:
            json_df = df.reset_index(drop=True)
        json_df.to_json(path, orient="records", force_ascii=False)
    else:
        raise ValueError(f"不支持的输出格式: {output_format}")


def process_file(
    source: Path,
    args: argparse.Namespace,
    output_path: Path,
) -> ConversionResult:
    try:
        print(f"正在处理: {source}")
        df = load_dataframe(source)
        original_shape = df.shape
        print(
            f"  原始形状: {original_shape} (行: {original_shape[0]}, 列: {original_shape[1]})"
        )

        if args.transpose:
            df = df.transpose()
            new_shape = df.shape
            print(
                f"  转置后: {new_shape} (行: {new_shape[0]}, 列: {new_shape[1]})"
            )
        else:
            print("  未执行转置。")

        if output_path.exists() and not args.overwrite:
            return ConversionResult(
                source=source,
                destination=output_path,
                success=False,
                message="输出文件已存在，如需覆盖请使用 --overwrite。",
            )

        save_dataframe(
            df,
            output_path,
            args.format,
            include_index=args.include_index,
            include_header=args.include_header,
        )

        print(f"  已保存到: {output_path}")
        return ConversionResult(source, output_path, True)
    except Exception as exc:  # noqa: BLE001
        return ConversionResult(
            source=source,
            destination=output_path,
            success=False,
            message=str(exc),
        )


def run(argv: Optional[Sequence[str]] = None) -> List[ConversionResult]:
    args = parse_arguments(argv)

    if args.format not in SUPPORTED_OUTPUT_FORMATS:
        raise ValueError(
            f"不支持的输出格式: {args.format}，可用选项: {', '.join(sorted(SUPPORTED_OUTPUT_FORMATS))}"
        )

    output_dir = Path(args.output_dir).expanduser().resolve() if args.output_dir else None

    patterns = normalize_patterns(args.pattern)
    files, warnings = gather_input_files(args.inputs, patterns, args.recursive)

    for warning in warnings:
        print(f"警告: {warning}", file=sys.stderr)

    if not files:
        raise FileNotFoundError("未找到任何可处理的文件，请检查输入路径或匹配模式。")

    results: List[ConversionResult] = []

    if args.output:
        # 单文件输出
        source = files[0]
        output_path = Path(args.output).expanduser().resolve()
        output_dir = output_path.parent
        output_dir.mkdir(parents=True, exist_ok=True)
        result = process_file(source, args, output_path)
        results.append(result)
    else:
        for source in files:
            output_path = determine_output_path(
                source=source,
                output_dir=output_dir,
                output_format=args.format,
                suffix=args.suffix,
                transpose=args.transpose,
            )
            result = process_file(source, args, output_path)
            results.append(result)

    return results


def print_summary(results: Sequence[ConversionResult]) -> None:
    success_count = sum(1 for r in results if r.success)
    failure_results = [r for r in results if not r.success]

    print("-" * 60)
    print(f"处理完成：成功 {success_count} 个，失败 {len(failure_results)} 个。")

    if failure_results:
        print("失败详情：")
        for result in failure_results:
            destination_display = (
                str(result.destination) if result.destination else "<未生成>"
            )
            print(f"- {result.source} -> {destination_display}")
            print(f"  原因: {result.message}")


def main(argv: Optional[Sequence[str]] = None) -> None:
    try:
        results = run(argv)
        print_summary(results)
        if any(not r.success for r in results):
            sys.exit(1)
    except Exception as exc:  # noqa: BLE001
        print(f"错误: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()