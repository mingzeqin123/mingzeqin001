#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
订单批量导入与校验工具

支持从 Excel 或 CSV 文件中读取订单数据，自动完成字段映射、基础清洗、
多维度校验（必填项、格式、取值范围、重复、金额一致性等），并生成
可直接落库的订单数据和带错误说明的待修复清单。
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

import pandas as pd

# ---- 配置区域 -----------------------------------------------------------------

# 支持的字段及其别名（大小写不敏感）
COLUMN_ALIASES: Dict[str, Iterable[str]] = {
    "order_id": ("order_id", "order id", "订单号", "订单编号"),
    "customer_name": ("customer_name", "客户名称", "客户姓名", "收货人"),
    "phone": ("phone", "手机号", "联系电话", "电话"),
    "product_name": ("product_name", "商品名称", "产品名称", "品名"),
    "quantity": ("quantity", "数量", "下单数量"),
    "unit_price": ("unit_price", "单价", "价格"),
    "order_date": ("order_date", "下单时间", "下单日期", "订单日期"),
    "status": ("status", "订单状态", "状态"),
    "currency": ("currency", "币种"),
    "total_amount": ("total_amount", "金额", "订单金额", "总金额"),
    "remark": ("remark", "备注"),
}

REQUIRED_FIELDS = (
    "order_id",
    "customer_name",
    "phone",
    "product_name",
    "quantity",
    "unit_price",
    "order_date",
    "status",
)

STATUS_ALIASES: Dict[str, str] = {
    "pending": "pending",
    "待支付": "pending",
    "未支付": "pending",
    "已下单": "pending",
    "paid": "paid",
    "已支付": "paid",
    "已收款": "paid",
    "shipped": "shipped",
    "已发货": "shipped",
    "delivered": "completed",
    "completed": "completed",
    "已完成": "completed",
    "canceled": "canceled",
    "cancelled": "canceled",
    "已取消": "canceled",
    "refunded": "refunded",
    "已退款": "refunded",
    "退款": "refunded",
}

PHONE_PATTERN = re.compile(r"^(?:1[3-9]\d{9}|[0-9\-()+\s]{6,20})$")
ORDER_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_\-]{3,31}$")
CURRENCY_PATTERN = re.compile(r"^[A-Z]{3}$")

DATE_FORMATS = (
    "%Y-%m-%d",
    "%Y/%m/%d",
    "%Y-%m-%d %H:%M:%S",
    "%Y/%m/%d %H:%M:%S",
    "%Y%m%d",
)


# ---- 数据结构 -----------------------------------------------------------------

@dataclass
class OrderRecord:
    order_id: str
    customer_name: str
    phone: str
    product_name: str
    quantity: int
    unit_price: float
    total_amount: float
    currency: str
    order_date: str
    status: str
    remark: Optional[str] = None

    def to_dict(self) -> Dict[str, object]:
        return {
            "order_id": self.order_id,
            "customer_name": self.customer_name,
            "phone": self.phone,
            "product_name": self.product_name,
            "quantity": self.quantity,
            "unit_price": round(self.unit_price, 2),
            "total_amount": round(self.total_amount, 2),
            "currency": self.currency,
            "order_date": self.order_date,
            "status": self.status,
            "remark": self.remark,
        }


@dataclass
class InvalidRow:
    row_number: object
    order_id: Optional[str]
    error_messages: List[str]
    raw_data: Dict[str, object]


# ---- 工具函数 -----------------------------------------------------------------

def _normalize_header(header: str) -> str:
    return header.strip().lower()


def detect_columns(df_columns: Iterable[str]) -> Dict[str, str]:
    """根据别名映射找到实际列名"""
    normalized = {_normalize_header(col): col for col in df_columns}
    column_map: Dict[str, str] = {}

    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            key = _normalize_header(str(alias))
            if key in normalized:
                column_map[canonical] = normalized[key]
                break

    missing = [field for field in REQUIRED_FIELDS if field not in column_map]
    if missing:
        raise ValueError(f"缺少必要字段: {', '.join(missing)}")
    return column_map


def read_source(path: Path, sheet_name: Optional[str], encoding: str) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"文件不存在: {path}")

    suffix = path.suffix.lower()
    if suffix in {".xlsx", ".xls"}:
        return pd.read_excel(path, sheet_name=sheet_name or 0)
    if suffix == ".csv":
        return pd.read_csv(path, encoding=encoding)

    raise ValueError("仅支持 .xlsx / .xls / .csv 文件")


def is_empty(value: object) -> bool:
    if value is None:
        return True
    if isinstance(value, float) and pd.isna(value):
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    return False


def normalize_text(value: object) -> str:
    if is_empty(value):
        return ""
    return str(value).strip()


def parse_positive_int(value: object) -> Optional[int]:
    if is_empty(value):
        return None
    try:
        number = int(float(value))
        if number <= 0:
            return None
        return number
    except (ValueError, TypeError):
        return None


def parse_positive_float(value: object) -> Optional[float]:
    if is_empty(value):
        return None
    try:
        number = float(value)
        if number <= 0:
            return None
        return number
    except (ValueError, TypeError):
        return None


def parse_order_date(value: object) -> Optional[str]:
    if is_empty(value):
        return None
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    text = normalize_text(value)
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt).strftime("%Y-%m-%d %H:%M:%S")
        except ValueError:
            continue
    return None


def normalize_status(value: object) -> Optional[str]:
    if is_empty(value):
        return None
    key = normalize_text(value).lower()
    return STATUS_ALIASES.get(key)


def normalize_currency(value: object) -> str:
    text = normalize_text(value) or "CNY"
    text = text.upper()
    if not CURRENCY_PATTERN.match(text):
        return "CNY"
    return text


def sanitize_phone(value: object) -> Optional[str]:
    if is_empty(value):
        return None
    phone = re.sub(r"[\s\-()+]", "", str(value))
    if PHONE_PATTERN.match(phone) or PHONE_PATTERN.match(value if isinstance(value, str) else ""):
        return phone
    return None


def calculate_total(quantity: int, unit_price: float) -> float:
    return round(quantity * unit_price, 2)


def to_row_number(index_value: object) -> object:
    try:
        return int(index_value) + 2
    except (TypeError, ValueError):
        return index_value


# ---- 核心逻辑 -----------------------------------------------------------------

def validate_orders(df: pd.DataFrame) -> Tuple[List[OrderRecord], List[InvalidRow]]:
    column_map = detect_columns(df.columns)
    valid_rows: List[OrderRecord] = []
    invalid_rows: List[InvalidRow] = []
    seen_order_ids: Dict[str, object] = {}

    for index_value, row in df.iterrows():
        row_number = to_row_number(index_value)
        errors: List[str] = []

        order_id_raw = row[column_map["order_id"]]
        order_id = normalize_text(order_id_raw)
        if not order_id:
            errors.append("订单号为空")
        elif not ORDER_ID_PATTERN.match(order_id):
            errors.append("订单号格式不合法（仅支持字母/数字/_/-，长度4-32）")
        elif order_id in seen_order_ids:
            errors.append(f"订单号重复（首次出现在第{seen_order_ids[order_id]}行）")
        else:
            seen_order_ids[order_id] = row_number

        customer_name = normalize_text(row[column_map["customer_name"]])
        if not customer_name:
            errors.append("客户名称为空")

        phone = sanitize_phone(row[column_map["phone"]])
        if not phone:
            errors.append("手机号缺失或格式不正确")

        product_name = normalize_text(row[column_map["product_name"]])
        if not product_name:
            errors.append("商品名称为空")

        quantity = parse_positive_int(row[column_map["quantity"]])
        if quantity is None:
            errors.append("数量必须为正整数")

        unit_price = parse_positive_float(row[column_map["unit_price"]])
        if unit_price is None:
            errors.append("单价必须为正数")

        order_date = parse_order_date(row[column_map["order_date"]])
        if order_date is None:
            errors.append("订单日期缺失或格式不正确")

        status = normalize_status(row[column_map["status"]])
        if status is None:
            errors.append("订单状态不受支持")

        currency = normalize_currency(
            row[column_map["currency"]] if "currency" in column_map else "CNY"
        )

        total_amount = calculate_total(quantity, unit_price) if quantity and unit_price else None
        if "total_amount" in column_map and not is_empty(row[column_map["total_amount"]]):
            source_amount = parse_positive_float(row[column_map["total_amount"]])
            if source_amount is None:
                errors.append("金额字段无法解析为正数")
            elif total_amount is not None and abs(source_amount - total_amount) > 0.01:
                errors.append(
                    f"金额不一致，应为 {total_amount:.2f}，实际 {source_amount:.2f}"
                )
            else:
                total_amount = source_amount

        remark = normalize_text(row[column_map["remark"]]) if "remark" in column_map else None

        if errors or None in (quantity, unit_price, total_amount):
            invalid_rows.append(
                InvalidRow(
                    row_number=row_number,
                    order_id=order_id or None,
                    error_messages=errors or ["未知错误"],
                    raw_data={col: row[col] for col in df.columns},
                )
            )
            continue

        valid_rows.append(
            OrderRecord(
                order_id=order_id,
                customer_name=customer_name,
                phone=phone or "",
                product_name=product_name,
                quantity=quantity or 0,
                unit_price=unit_price or 0.0,
                total_amount=total_amount or calculate_total(quantity, unit_price),
                currency=currency,
                order_date=order_date,
                status=status,
                remark=remark or None,
            )
        )

    return valid_rows, invalid_rows


def write_results(
    valid_rows: List[OrderRecord],
    invalid_rows: List[InvalidRow],
    valid_output: Path,
    invalid_output: Path,
) -> None:
    if valid_rows:
        data = [record.to_dict() for record in valid_rows]
        valid_output.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"✅ 已导出 {len(valid_rows)} 条合法订单 -> {valid_output}")
    else:
        print("⚠️ 没有可导出的合法订单")

    if invalid_rows:
        invalid_df = pd.DataFrame(
            [
                {
                    "row_number": row.row_number,
                    "order_id": row.order_id,
                    "error_messages": "；".join(row.error_messages),
                    **row.raw_data,
                }
                for row in invalid_rows
            ]
        )
        if invalid_output.suffix.lower() == ".xlsx":
            invalid_df.to_excel(invalid_output, index=False)
        else:
            invalid_df.to_csv(invalid_output, index=False, encoding="utf-8-sig")
        print(f"❌ 有 {len(invalid_rows)} 条记录校验失败 -> {invalid_output}")
    else:
        print("🎉 没有校验失败的记录")


# ---- CLI ---------------------------------------------------------------------

def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="订单批量导入与校验工具（支持 Excel / CSV）",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("source", help="包含订单数据的 Excel/CSV 文件路径")
    parser.add_argument("--sheet", help="Excel 工作表名称（留空则使用第一个）")
    parser.add_argument("--encoding", default="utf-8", help="读取 CSV 时使用的编码")
    parser.add_argument(
        "--valid-output",
        dest="valid_output",
        help="合法订单输出文件（JSON），默认与输入同名",
    )
    parser.add_argument(
        "--invalid-output",
        dest="invalid_output",
        help="异常记录输出文件（CSV 或 XLSX），默认与输入同名",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="存在校验失败记录时返回非零退出码",
    )
    return parser


def resolve_output_paths(args: argparse.Namespace, source_path: Path) -> Tuple[Path, Path]:
    base = source_path.with_suffix("")
    valid_output = Path(args.valid_output) if args.valid_output else Path(f"{base}_valid.json")
    invalid_output = (
        Path(args.invalid_output) if args.invalid_output else Path(f"{base}_invalid.csv")
    )
    return valid_output, invalid_output


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_arg_parser()
    args = parser.parse_args(argv)

    source_path = Path(args.source).expanduser().resolve()
    try:
        df = read_source(source_path, args.sheet, args.encoding)
    except Exception as exc:  # noqa: BLE001
        print(f"读取文件失败: {exc}")
        return 2

    try:
        valid_rows, invalid_rows = validate_orders(df)
    except Exception as exc:  # noqa: BLE001
        print(f"校验过程中发生错误: {exc}")
        return 3

    valid_output, invalid_output = resolve_output_paths(args, source_path)
    write_results(valid_rows, invalid_rows, valid_output, invalid_output)

    print(
        f"汇总: 共 {len(df)} 条，合法 {len(valid_rows)} 条，异常 {len(invalid_rows)} 条。"
    )

    if args.strict and invalid_rows:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
