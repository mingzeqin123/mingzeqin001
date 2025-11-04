#!/usr/bin/env python3
"""Wenxin Yiyan usage logger and cost estimator.

This utility helps you keep track of every interaction with Baidu's Wenxin
Yiyan (ERNIE Bot) models by recording prompt/response statistics alongside
token usage and RMB costs. It also provides quick daily cost estimates based on
the recorded data.

Usage examples:

  # 1) Configure pricing for a model (RMB per 1K tokens)
  python scripts/wenxin_usage_logger.py set-price ERNIE-Bot-4.0 \
      --input-price 0.012 --output-price 0.016

  # 2) Record a new interaction (tokens can come from API usage data)
  python scripts/wenxin_usage_logger.py record \
      --model ERNIE-Bot-4.0 \
      --prompt "写一首关于春天的七言绝句" --prompt-tokens 120 \
      --response "春风拂面柳如烟..." --response-tokens 98 \
      --notes "用户每日灵感问答"

  # 3) Review recent spending
  python scripts/wenxin_usage_logger.py report --days 7 --show-daily

The script stores data in CSV format by default (``wenxin_usage_log.csv``) so
that it can be easily processed further or imported into spreadsheets.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Optional, Tuple, TYPE_CHECKING

try:
    import pandas as pd
except ImportError:  # pragma: no cover - optional dependency fallback
    pd = None  # type: ignore[assignment]
    if TYPE_CHECKING:  # pragma: no cover
        import pandas as pd  # type: ignore


DEFAULT_LOG_PATH = Path(__file__).resolve().parent / "wenxin_usage_log.csv"
DEFAULT_CONFIG_PATH = Path(__file__).resolve().parent / "wenxin_price_config.json"

FIELDNAMES = [
    "timestamp_utc",
    "model",
    "prompt_chars",
    "prompt_tokens",
    "response_chars",
    "response_tokens",
    "total_tokens",
    "input_price_per_1k",
    "output_price_per_1k",
    "input_cost_rmb",
    "output_cost_rmb",
    "total_cost_rmb",
    "notes",
    "prompt_text",
    "response_text",
]


@dataclass
class PricePlan:
    """Represents the RMB pricing (per 1K tokens) for a model."""

    input_per_1k_tokens: float
    output_per_1k_tokens: float
    currency: str = "RMB"

    @classmethod
    def from_dict(cls, data: Dict[str, float]) -> "PricePlan":
        try:
            return cls(
                input_per_1k_tokens=float(data["input_per_1k_tokens"]),
                output_per_1k_tokens=float(data["output_per_1k_tokens"]),
                currency=data.get("currency", "RMB"),
            )
        except (KeyError, TypeError, ValueError) as exc:
            raise ValueError(
                "Price configuration must contain 'input_per_1k_tokens' and "
                "'output_per_1k_tokens' values."
            ) from exc

    def to_dict(self) -> Dict[str, float]:
        data = asdict(self)
        return data


def load_price_config(path: Path) -> Dict[str, PricePlan]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as fh:
        raw = json.load(fh)
    return {model: PricePlan.from_dict(values) for model, values in raw.items()}


def save_price_config(path: Path, data: Dict[str, PricePlan]) -> None:
    serializable = {model: plan.to_dict() for model, plan in data.items()}
    with path.open("w", encoding="utf-8") as fh:
        json.dump(serializable, fh, ensure_ascii=False, indent=2)


def resolve_text_argument(arg_value: Optional[str], file_path: Optional[str], label: str) -> str:
    if arg_value and file_path:
        raise SystemExit(f"请仅为 {label} 提供文本或文件路径中的一种输入方式。")
    if file_path:
        file = Path(file_path)
        if not file.exists():
            raise SystemExit(f"未找到 {label} 文件: {file}")
        return file.read_text(encoding="utf-8")
    if arg_value is None:
        raise SystemExit(f"必须通过 --{label} 或 --{label}-file 提供{label}内容。")
    return arg_value


def auto_estimate_tokens(text: str, char_to_token_ratio: float) -> int:
    if char_to_token_ratio <= 0:
        raise SystemExit("--char-to-token-ratio 必须大于 0")
    # For Chinese, a simple approximation is 1 char ≈ 1 token. Provide an
    # adjustable ratio so users can calibrate with real measurements.
    estimated = math.ceil(len(text) / char_to_token_ratio)
    return max(int(estimated), 0)


def parse_timestamp(value: str) -> datetime:
    normalized = value.strip()
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise SystemExit(
            "时间格式不合法，请使用 ISO8601 格式，例如 2025-01-01T12:00:00+08:00"
        ) from exc


def ensure_log_header(log_path: Path) -> None:
    if log_path.exists():
        return
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=FIELDNAMES)
        writer.writeheader()


def append_log_entry(
    log_path: Path,
    record: Dict[str, object],
    store_text: bool,
) -> None:
    ensure_log_header(log_path)

    if not store_text:
        record = dict(record)
        record["prompt_text"] = ""
        record["response_text"] = ""

    with log_path.open("a", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=FIELDNAMES)
        writer.writerow(record)


def command_set_price(args: argparse.Namespace) -> None:
    config_path: Path = args.config
    config = load_price_config(config_path)
    config[args.model] = PricePlan(
        input_per_1k_tokens=args.input_price,
        output_per_1k_tokens=args.output_price,
        currency="RMB",
    )
    save_price_config(config_path, config)
    print(
        f"已更新模型 {args.model} 的价格: 输入 ¥{args.input_price}/千tokens, "
        f"输出 ¥{args.output_price}/千tokens。",
    )


def command_list_price(args: argparse.Namespace) -> None:
    config_path: Path = args.config
    config = load_price_config(config_path)
    if not config:
        print("尚未配置任何模型价格。使用 set-price 子命令添加。")
        return
    print("当前价格配置 (单位: RMB/千tokens):")
    for model, plan in config.items():
        print(
            f"  - {model}: 输入 {plan.input_per_1k_tokens:.6f}, "
            f"输出 {plan.output_per_1k_tokens:.6f}"
        )


def command_record(args: argparse.Namespace) -> None:
    config_path: Path = args.config
    config = load_price_config(config_path)

    prompt_text = resolve_text_argument(args.prompt, args.prompt_file, "prompt")
    response_text = resolve_text_argument(args.response, args.response_file, "response")

    prompt_chars = len(prompt_text)
    response_chars = len(response_text)

    if args.prompt_tokens is not None and args.prompt_tokens < 0:
        raise SystemExit("--prompt-tokens 不能为负数")
    if args.response_tokens is not None and args.response_tokens < 0:
        raise SystemExit("--response-tokens 不能为负数")

    prompt_tokens = (
        args.prompt_tokens
        if args.prompt_tokens is not None
        else auto_estimate_tokens(prompt_text, args.char_to_token_ratio)
    )

    response_tokens = (
        args.response_tokens
        if args.response_tokens is not None
        else auto_estimate_tokens(response_text, args.char_to_token_ratio)
    )

    plan = config.get(args.model)
    input_price = args.input_price if args.input_price is not None else (plan.input_per_1k_tokens if plan else None)
    output_price = args.output_price if args.output_price is not None else (plan.output_per_1k_tokens if plan else None)

    if input_price is None or output_price is None:
        raise SystemExit(
            "未找到该模型的价格配置。请通过 set-price 命令配置，或在 record 时使用 "
            "--input-price / --output-price 参数。"
        )

    input_cost = (prompt_tokens / 1000) * input_price
    output_cost = (response_tokens / 1000) * output_price
    total_cost = input_cost + output_cost

    timestamp = parse_timestamp(args.timestamp) if args.timestamp else datetime.now(tz=timezone.utc)
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)

    record = {
        "timestamp_utc": timestamp.astimezone(timezone.utc).isoformat(),
        "model": args.model,
        "prompt_chars": prompt_chars,
        "prompt_tokens": prompt_tokens,
        "response_chars": response_chars,
        "response_tokens": response_tokens,
        "total_tokens": prompt_tokens + response_tokens,
        "input_price_per_1k": input_price,
        "output_price_per_1k": output_price,
        "input_cost_rmb": round(input_cost, 6),
        "output_cost_rmb": round(output_cost, 6),
        "total_cost_rmb": round(total_cost, 6),
        "notes": args.notes or "",
        "prompt_text": prompt_text,
        "response_text": response_text,
    }

    append_log_entry(args.log_file, record, store_text=args.store_text)

    print("已记录一次交互：")
    print(f"  模型: {args.model}")
    print(f"  提问字数/Token: {prompt_chars} chars / {prompt_tokens} tokens")
    print(f"  回复字数/Token: {response_chars} chars / {response_tokens} tokens")
    print(
        "  成本: 输入 ¥{:.6f}, 输出 ¥{:.6f}, 合计 ¥{:.6f}".format(
            input_cost, output_cost, total_cost
        )
    )
    print(f"  数据已保存至: {args.log_file}")


def generate_report(df: "pd.DataFrame", forecast_days: int) -> Tuple["pd.DataFrame", Optional[float]]:
    if df.empty:
        return df, None

    df["date"] = df["timestamp_utc"].dt.date
    daily = (
        df.groupby("date")
        .agg(
            interactions=("total_cost_rmb", "count"),
            total_tokens=("total_tokens", "sum"),
            total_cost_rmb=("total_cost_rmb", "sum"),
        )
        .reset_index()
        .sort_values("date")
    )

    if forecast_days <= 0:
        return daily, None

    tail = daily.tail(forecast_days)
    if tail.empty:
        return daily, None

    average_daily_cost = tail["total_cost_rmb"].mean()
    return daily, average_daily_cost


def command_report(args: argparse.Namespace) -> None:
    if pd is None:
        raise SystemExit(
            "报告功能需要 pandas 库，请先执行 `pip install -r requirements.txt` 再试。"
        )
    log_path: Path = args.log_file
    if not log_path.exists():
        raise SystemExit(f"未找到日志文件: {log_path}。请先使用 record 命令记录数据。")

    df = pd.read_csv(log_path, parse_dates=["timestamp_utc"])

    daily, avg_cost = generate_report(df, args.days)

    if daily.empty:
        print("日志为空，暂无可用数据。")
        return

    if args.show_daily:
        print(f"最近 {len(daily)} 天的每日成本 (RMB)：")
        for _, row in daily.iterrows():
            print(
                f"  {row['date']}: 交互 {row['interactions']}, "
                f"Tokens {int(row['total_tokens'])}, 成本 ¥{row['total_cost_rmb']:.6f}"
            )

    last_days = daily.tail(args.days)
    if last_days.empty:
        print("不足以计算指定天数的平均值。")
        return

    avg_daily_cost = last_days["total_cost_rmb"].mean()
    avg_daily_tokens = last_days["total_tokens"].mean()
    projected_monthly = avg_daily_cost * 30

    print("统计区间：{} 至 {}".format(last_days["date"].min(), last_days["date"].max()))
    print(f"平均每日消耗（基于最近 {len(last_days)} 天）：¥{avg_daily_cost:.6f}")
    print(f"平均每日Tokens：{avg_daily_tokens:.2f}")
    print(f"按30天估算月度消耗：¥{projected_monthly:.2f}")

    if args.export_excel:
        output_path = Path(args.export_excel)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with pd.ExcelWriter(output_path) as writer:
            daily.to_excel(writer, sheet_name="daily", index=False)
            last_days.to_excel(writer, sheet_name="recent_window", index=False)
        print(f"已导出统计到 Excel：{output_path}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="记录文心一言调用的字符、token 与成本，并估算每日费用。"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # set-price command
    set_price = subparsers.add_parser("set-price", help="设置或更新模型的千Token价格")
    set_price.add_argument("model", help="模型名称，例如 ERNIE-Bot-4.0")
    set_price.add_argument("--input-price", type=float, required=True, help="输入Token价格 (RMB/千Token)")
    set_price.add_argument("--output-price", type=float, required=True, help="输出Token价格 (RMB/千Token)")
    set_price.add_argument(
        "--config",
        type=Path,
        default=DEFAULT_CONFIG_PATH,
        help=f"价格配置文件路径 (默认: {DEFAULT_CONFIG_PATH})",
    )
    set_price.set_defaults(func=command_set_price)

    # list-price command
    list_price = subparsers.add_parser("list-price", help="列出当前已配置的模型价格")
    list_price.add_argument(
        "--config",
        type=Path,
        default=DEFAULT_CONFIG_PATH,
        help=f"价格配置文件路径 (默认: {DEFAULT_CONFIG_PATH})",
    )
    list_price.set_defaults(func=command_list_price)

    # record command
    record = subparsers.add_parser("record", help="记录一次文心一言交互")
    record.add_argument("--model", default="ERNIE-Bot", help="模型名称")
    record.add_argument("--prompt", help="提问文本")
    record.add_argument("--prompt-file", help="提问文本文件路径")
    record.add_argument("--response", help="回复文本")
    record.add_argument("--response-file", help="回复文本文件路径")
    record.add_argument("--prompt-tokens", type=int, help="提问Token数量 (若不提供则根据字数估算)")
    record.add_argument("--response-tokens", type=int, help="回复Token数量 (若不提供则根据字数估算)")
    record.add_argument(
        "--char-to-token-ratio",
        type=float,
        default=1.0,
        help="字数换算Token的比例，默认为1 (适合中文)",
    )
    record.add_argument(
        "--input-price",
        type=float,
        help="输入Token价格 (RMB/千Token)，优先级高于配置文件",
    )
    record.add_argument(
        "--output-price",
        type=float,
        help="输出Token价格 (RMB/千Token)，优先级高于配置文件",
    )
    record.add_argument(
        "--timestamp",
        help="可选时间戳 (ISO8601)，默认使用当前UTC时间",
    )
    record.add_argument(
        "--notes",
        help="可选备注信息，例如调用场景或业务线",
    )
    record.add_argument(
        "--store-text",
        action="store_true",
        help="是否在日志中保存提问和回复原文 (默认仅记录统计数据)",
    )
    record.add_argument(
        "--log-file",
        type=Path,
        default=DEFAULT_LOG_PATH,
        help=f"日志文件路径 (默认: {DEFAULT_LOG_PATH})",
    )
    record.add_argument(
        "--config",
        type=Path,
        default=DEFAULT_CONFIG_PATH,
        help=f"价格配置文件路径 (默认: {DEFAULT_CONFIG_PATH})",
    )
    record.set_defaults(func=command_record)

    # report command
    report = subparsers.add_parser("report", help="生成成本统计报告并估算每日花费")
    report.add_argument(
        "--days",
        type=int,
        default=7,
        help="估算平均每日成本所使用的最近天数",
    )
    report.add_argument(
        "--show-daily",
        action="store_true",
        help="输出所有日期的详细成本数据",
    )
    report.add_argument(
        "--export-excel",
        help="可选，将结果导出到指定路径的Excel文件",
    )
    report.add_argument(
        "--log-file",
        type=Path,
        default=DEFAULT_LOG_PATH,
        help=f"日志文件路径 (默认: {DEFAULT_LOG_PATH})",
    )
    report.set_defaults(func=command_report)

    return parser


def main(argv: Optional[list[str]] = None) -> None:
    parser = build_parser()
    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
