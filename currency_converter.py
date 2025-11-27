#!/usr/bin/env python3
"""Simple currency conversion helper with RMB uppercase output.

The script accepts a numeric amount denominated in RMB, prints its uppercase
representation (人民币大写), and fetches real-time exchange rates to convert the
amount into other major currencies using exchangerate.host.
"""
from __future__ import annotations

import argparse
import json
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Dict, Iterable, List, Tuple
from urllib import error, request

API_URL = "https://open.er-api.com/v6/latest"
DEFAULT_SYMBOLS = ("USD", "EUR", "JPY", "GBP", "HKD")

RMB_UPPER_DIGITS = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"]
RMB_UPPER_UNITS = ["", "拾", "佰", "仟"]
RMB_SECTION_UNITS = ["", "万", "亿", "兆"]


def parse_symbols(raw: str | None) -> List[str]:
    if raw is None:
        return list(DEFAULT_SYMBOLS)
    symbols = [token.strip().upper() for token in raw.split(",") if token.strip()]
    if not symbols:
        raise argparse.ArgumentTypeError("至少需要指定一个目标货币代码")
    return symbols


def decimal_amount(raw: str) -> Decimal:
    try:
        value = Decimal(raw)
    except (InvalidOperation, ValueError) as exc:
        raise argparse.ArgumentTypeError(f"无法解析金额: {raw}") from exc
    return value


def fetch_exchange_rates(symbols: Iterable[str], timeout: float, api_url: str = API_URL) -> Tuple[Dict[str, Decimal], str]:
    url = f"{api_url}/CNY"
    req = request.Request(url, headers={"User-Agent": "currency-converter/1.0"})
    try:
        with request.urlopen(req, timeout=timeout) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except error.URLError as exc:
        raise RuntimeError(f"无法获取实时汇率: {exc}") from exc

    if payload.get("result") != "success":
        raise RuntimeError(payload.get("error-type", "汇率接口返回失败"))

    rates = payload.get("rates") or payload.get("conversion_rates") or {}
    missing = [code for code in symbols if code not in rates]
    if missing:
        raise RuntimeError(f"汇率接口缺少: {', '.join(missing)}")

    timestamp = payload.get("time_last_update_utc") or str(payload.get("time_last_update_unix", "未知时间"))
    return {code: Decimal(str(rates[code])) for code in symbols}, timestamp


def section_to_upper(section: int) -> str:
    result = ""
    unit_pos = 0
    zero = True
    while section > 0:
        digit = section % 10
        if digit == 0:
            if not zero:
                zero = True
                result = RMB_UPPER_DIGITS[0] + result
        else:
            zero = False
            result = RMB_UPPER_DIGITS[digit] + RMB_UPPER_UNITS[unit_pos] + result
        unit_pos += 1
        section //= 10
    return result


def integer_to_upper(value: int) -> str:
    if value == 0:
        return RMB_UPPER_DIGITS[0]

    result = ""
    unit_idx = 0
    zero_pending = False

    while value > 0:
        section = value % 10000
        value //= 10000

        if section == 0:
            if result:
                zero_pending = True
        else:
            section_str = section_to_upper(section) + RMB_SECTION_UNITS[unit_idx]
            if zero_pending:
                result = RMB_UPPER_DIGITS[0] + result
                zero_pending = False
            result = section_str + result
            if section < 1000 and value > 0:
                zero_pending = True

        unit_idx += 1

    return result


def number_to_rmb_uppercase(amount: Decimal) -> str:
    if amount == 0:
        return "零元整"

    negative = amount < 0
    scaled = (abs(amount) * 100).to_integral_value(rounding=ROUND_HALF_UP)
    integer_part = int(scaled // 100)
    frac = int(scaled % 100)
    jiao = frac // 10
    fen = frac % 10

    parts = []
    if negative:
        parts.append("负")

    parts.append(integer_to_upper(integer_part))
    parts.append("元")

    if jiao == 0 and fen == 0:
        parts.append("整")
    else:
        if jiao > 0:
            parts.append(RMB_UPPER_DIGITS[jiao] + "角")
        if jiao == 0 and fen > 0 and integer_part != 0:
            parts.append(RMB_UPPER_DIGITS[0])
        if fen > 0:
            parts.append(RMB_UPPER_DIGITS[fen] + "分")

    return "".join(parts)


def convert_amount(amount: Decimal, rates: Dict[str, Decimal]) -> Dict[str, Decimal]:
    result: Dict[str, Decimal] = {}
    for code, rate in rates.items():
        converted = (amount * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        result[code] = converted
    return result


def format_money(value: Decimal) -> str:
    return f"{value:,.2f}"


def main() -> None:
    parser = argparse.ArgumentParser(description="人民币金额转换并输出人民币大写")
    parser.add_argument("amount", type=decimal_amount, help="输入人民币金额，例如 1234.56")
    parser.add_argument(
        "--symbols",
        dest="symbols",
        default=None,
        help="逗号分隔的目标货币代码，默认: USD,EUR,JPY,GBP,HKD",
    )
    parser.add_argument("--timeout", type=float, default=10.0, help="HTTP 请求超时时间（秒）")
    parser.add_argument("--api-url", default=API_URL, help="自定义汇率 API 地址，可选")
    args = parser.parse_args()

    symbols = parse_symbols(args.symbols)
    amount = args.amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    print(f"输入金额: {format_money(amount)} 人民币")
    print(f"人民币大写: {number_to_rmb_uppercase(amount)}")

    try:
        rates, rate_date = fetch_exchange_rates(symbols, timeout=args.timeout, api_url=args.api_url)
    except RuntimeError as exc:
        print(f"\n未能获取实时汇率: {exc}")
        return

    conversions = convert_amount(amount, rates)

    print(f"\n实时汇率日期: {rate_date}")
    print("按目标货币输出:")
    code_width = max(len(code) for code in conversions) + 2
    for code in symbols:
        value = conversions[code]
        print(f"{code:<{code_width}}{format_money(value)}")


if __name__ == "__main__":
    main()
