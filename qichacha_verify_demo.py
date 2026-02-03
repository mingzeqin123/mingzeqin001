#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Qichacha EnterpriseInfo/Verify API demo.

Endpoint:
  https://api.qichacha.com/EnterpriseInfo/Verify

Request method: GET

Query parameters:
  key       - AppKey
  searchKey - company name or credit code

Headers:
  Token    - MD5(AppKey + Timespan + SecretKey).upper()
  Timespan - Unix timestamp (seconds)
"""

import argparse
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Optional


API_URL = "https://api.qichacha.com/EnterpriseInfo/Verify"


def build_token(app_key: str, secret_key: str, timespan: str) -> str:
    raw = f"{app_key}{timespan}{secret_key}"
    return hashlib.md5(raw.encode("utf-8")).hexdigest().upper()


def build_request_url(app_key: str, search_key: str) -> str:
    params = {"key": app_key, "searchKey": search_key}
    return f"{API_URL}?{urllib.parse.urlencode(params)}"


def call_verify_api(
    app_key: str,
    secret_key: str,
    search_key: str,
    timespan: Optional[str] = None,
    timeout: int = 10,
) -> dict:
    if timespan is None:
        timespan = str(int(time.time()))
    else:
        timespan = str(timespan)

    token = build_token(app_key, secret_key, timespan)
    url = build_request_url(app_key, search_key)
    headers = {
        "Token": token,
        "Timespan": timespan,
        "Accept": "application/json",
    }

    request = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
            content_type = response.headers.get("Content-Type", "")
            if "application/json" in content_type:
                return json.loads(body)
            return {"raw": body}
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        return {"http_status": exc.code, "error": error_body}
    except urllib.error.URLError as exc:
        return {"error": str(exc)}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Qichacha EnterpriseInfo/Verify API demo"
    )
    parser.add_argument(
        "--app-key",
        default=os.getenv("QCC_APP_KEY"),
        help="AppKey (env: QCC_APP_KEY)",
    )
    parser.add_argument(
        "--secret-key",
        default=os.getenv("QCC_SECRET_KEY"),
        help="SecretKey (env: QCC_SECRET_KEY)",
    )
    parser.add_argument(
        "--search-key",
        default=os.getenv("QCC_SEARCH_KEY"),
        help="Company name or credit code (env: QCC_SEARCH_KEY)",
    )
    parser.add_argument(
        "--timespan",
        default=None,
        help="Unix timestamp seconds (optional)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=10,
        help="HTTP timeout seconds",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    missing = [
        name
        for name, value in [
            ("app-key", args.app_key),
            ("secret-key", args.secret_key),
            ("search-key", args.search_key),
        ]
        if not value
    ]

    if missing:
        print("Missing required values: " + ", ".join(missing))
        print(
            "Provide args or set env: "
            "QCC_APP_KEY, QCC_SECRET_KEY, QCC_SEARCH_KEY"
        )
        sys.exit(1)

    result = call_verify_api(
        args.app_key,
        args.secret_key,
        args.search_key,
        args.timespan,
        args.timeout,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
