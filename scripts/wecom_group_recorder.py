#!/usr/bin/env python3
"""Utilities for recording Enterprise WeChat (WeCom) group user information.

This script authenticates with the WeCom API, fetches group chat metadata and
member lists, and persists them locally as JSON and/or CSV for further
analysis. Secrets are read from command-line arguments or environment
variables.
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

import requests


WECOM_API_BASE = "https://qyapi.weixin.qq.com/cgi-bin"


class WeComAPIError(RuntimeError):
    """Raised when the WeCom OpenAPI responds with an error."""


class WeComClient:
    """Minimal WeCom API client focused on external contact group chats."""

    _RETRYABLE_TOKEN_ERRCODES = {40014, 42001, 42007, 42009}

    def __init__(
        self,
        corp_id: str,
        corp_secret: str,
        base_url: str = WECOM_API_BASE,
        timeout: int = 10,
    ) -> None:
        if not corp_id:
            raise ValueError("corp_id is required")
        if not corp_secret:
            raise ValueError("corp_secret is required")

        self._corp_id = corp_id
        self._corp_secret = corp_secret
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._session = requests.Session()
        self._access_token: Optional[str] = None
        self._expires_at: float = 0.0

    def _ensure_access_token(self) -> None:
        now = time.time()
        if self._access_token and now < self._expires_at - 60:
            return

        url = f"{self._base_url}/gettoken"
        params = {
            "corpid": self._corp_id,
            "corpsecret": self._corp_secret,
        }
        response = self._session.get(url, params=params, timeout=self._timeout)
        response.raise_for_status()
        payload = response.json()

        if payload.get("errcode") != 0:
            raise WeComAPIError(
                f"Failed to obtain access_token: {payload.get('errcode')} {payload.get('errmsg')}"
            )

        self._access_token = payload["access_token"]
        expires_in = payload.get("expires_in", 7200)
        self._expires_at = now + float(expires_in)
        logging.debug("Fetched new access token valid for %ss", expires_in)

    def _request(
        self,
        method: str,
        endpoint: str,
        *,
        params: Optional[Dict[str, Any]] = None,
        json_payload: Optional[Dict[str, Any]] = None,
        retry: bool = True,
    ) -> Dict[str, Any]:
        self._ensure_access_token()

        request_params = dict(params or {})
        request_params["access_token"] = self._access_token
        url = f"{self._base_url}/{endpoint.lstrip('/')}"

        response = self._session.request(
            method=method.upper(),
            url=url,
            params=request_params,
            json=json_payload,
            timeout=self._timeout,
        )
        response.raise_for_status()
        payload = response.json()

        errcode = payload.get("errcode")
        if errcode in self._RETRYABLE_TOKEN_ERRCODES and retry:
            logging.info("Access token may be expired. Refreshing and retrying %s", endpoint)
            self._access_token = None
            return self._request(
                method,
                endpoint,
                params=params,
                json_payload=json_payload,
                retry=False,
            )

        if errcode not in (None, 0):
            raise WeComAPIError(
                f"WeCom API error for {endpoint}: {errcode} {payload.get('errmsg')}"
            )

        return payload

    def iter_group_chat_summaries(
        self,
        *,
        status_filter: int = 0,
        owner_userids: Optional[List[str]] = None,
        limit: int = 1000,
    ) -> Iterable[Dict[str, Any]]:
        """Yield group chat summary items produced by groupchat/list."""

        cursor: Optional[str] = None
        while True:
            payload: Dict[str, Any] = {
                "status_filter": status_filter,
                "limit": limit,
            }
            if owner_userids:
                payload["owner_filter"] = {"userid_list": owner_userids}
            if cursor:
                payload["cursor"] = cursor

            result = self._request(
                "POST",
                "externalcontact/groupchat/list",
                json_payload=payload,
            )
            summaries = result.get("group_chat_list", []) or []
            logging.debug("Fetched %d group chats (limit=%d, cursor=%s)", len(summaries), limit, cursor)
            for item in summaries:
                yield item

            cursor = result.get("next_cursor")
            if not cursor:
                break

    def get_group_chat_detail(self, chat_id: str, *, need_name: bool = True) -> Dict[str, Any]:
        payload = {"chat_id": chat_id, "need_name": 1 if need_name else 0}
        result = self._request(
            "POST",
            "externalcontact/groupchat/get",
            json_payload=payload,
        )
        return result.get("group_chat", {})


def _to_iso8601(timestamp: Optional[int]) -> Optional[str]:
    if not timestamp:
        return None
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()


def flatten_group_chat(
    group_chat: Dict[str, Any],
    *,
    status: Optional[int] = None,
) -> List[Dict[str, Any]]:
    records: List[Dict[str, Any]] = []
    chat_id = group_chat.get("chat_id")
    group_name = group_chat.get("name")
    owner_userid = group_chat.get("owner")
    admins = {admin.get("userid") for admin in group_chat.get("admin_list", [])}
    members = group_chat.get("member_list", [])

    for member in members:
        member_type = member.get("type")
        if member_type == 1:
            member_id = member.get("userid")
        else:
            member_id = member.get("external_userid") or member.get("userid")

        record = {
            "chat_id": chat_id,
            "group_name": group_name,
            "status": status,
            "group_owner_userid": owner_userid,
            "member_id": member_id,
            "member_type": "internal" if member_type == 1 else "external",
            "member_name": member.get("name") or member.get("nickname") or member.get("group_nickname"),
            "member_group_nickname": member.get("group_nickname"),
            "member_join_scene": member.get("join_scene"),
            "member_join_time": member.get("join_time"),
            "member_join_time_iso": _to_iso8601(member.get("join_time")),
            "member_invitor_userid": (member.get("invitor") or {}).get("userid"),
            "member_is_admin": member.get("userid") in admins if member_type == 1 else False,
        }
        records.append(record)

    return records


def write_json(path: Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fp:
        json.dump(payload, fp, indent=2, sort_keys=True)
    logging.info("Wrote JSON output to %s", path)


def write_csv(path: Path, records: List[Dict[str, Any]]) -> None:
    if not records:
        logging.warning("No records to persist to CSV (%s)", path)
        return

    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = list(records[0].keys())
    with path.open("w", encoding="utf-8", newline="") as fp:
        writer = csv.DictWriter(fp, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)
    logging.info("Wrote CSV output to %s", path)


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch Enterprise WeChat group chat members and persist locally.",
    )
    parser.add_argument("--corp-id", dest="corp_id", default=os.getenv("WECOM_CORP_ID"), help="WeCom CorpID. Defaults to WECOM_CORP_ID env var.")
    parser.add_argument(
        "--corp-secret",
        dest="corp_secret",
        default=os.getenv("WECOM_CORP_SECRET"),
        help="Secret of the contact/CRM app. Defaults to WECOM_CORP_SECRET env var.",
    )
    parser.add_argument(
        "--chat-id",
        dest="chat_ids",
        action="append",
        help="Specific chat_id to fetch. Can be supplied multiple times.",
    )
    parser.add_argument(
        "--owner",
        dest="owners",
        action="append",
        help="Filter group chats by owner userid when using --all.",
    )
    parser.add_argument(
        "--status-filter",
        type=int,
        default=0,
        help="Filter for groupchat/list status (0=all, 1=activating, 2=normal, 3=moderation).",
    )
    parser.add_argument("--limit", type=int, default=1000, help="Pagination size for list API.")
    parser.add_argument("--all", action="store_true", help="Fetch all available chats via groupchat/list.")
    parser.add_argument(
        "--output-dir",
        default="data",
        help="Directory to store output files (created if missing).",
    )
    parser.add_argument(
        "--json-name",
        default="wecom_group_users.json",
        help="Filename for JSON output inside --output-dir.",
    )
    parser.add_argument(
        "--csv-name",
        default="wecom_group_users.csv",
        help="Filename for CSV output inside --output-dir.",
    )
    parser.add_argument("--skip-json", action="store_true", help="Skip writing JSON output.")
    parser.add_argument("--skip-csv", action="store_true", help="Skip writing CSV output.")
    parser.add_argument(
        "--log-level",
        default=os.getenv("LOG_LEVEL", "INFO"),
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        help="Logging verbosity.",
    )

    args = parser.parse_args(argv)
    if not args.corp_id or not args.corp_secret:
        parser.error("corp_id and corp_secret are required (via args or env vars).")

    if not args.all and not args.chat_ids:
        parser.error("Specify --all or provide at least one --chat-id.")

    if args.limit <= 0:
        parser.error("--limit must be positive")

    return args


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(level=getattr(logging, args.log_level.upper()), format="%(levelname)s %(message)s")

    client = WeComClient(args.corp_id, args.corp_secret)

    summaries: Dict[str, Dict[str, Any]] = {}
    if args.all:
        logging.info("Listing group chats (status_filter=%s, owners=%s)...", args.status_filter, args.owners)
        for item in client.iter_group_chat_summaries(
            status_filter=args.status_filter,
            owner_userids=args.owners,
            limit=args.limit,
        ):
            chat_id = item.get("chat_id")
            if not chat_id:
                continue
            summaries[chat_id] = item
        logging.info("Discovered %d group chats", len(summaries))

    if args.chat_ids:
        for chat_id in args.chat_ids:
            summaries.setdefault(chat_id, {"chat_id": chat_id})

    if not summaries:
        logging.warning("No group chats to process.")
        return 0

    groups: List[Dict[str, Any]] = []
    flat_records: List[Dict[str, Any]] = []

    for chat_id, summary in summaries.items():
        logging.info("Fetching details for chat %s", chat_id)
        detail = client.get_group_chat_detail(chat_id)
        if not detail:
            logging.warning("No detail returned for chat %s", chat_id)
            continue

        group_status = summary.get("status")
        detail.setdefault("status", group_status)
        groups.append(detail)
        flat_records.extend(flatten_group_chat(detail, status=group_status))

    fetched_at = datetime.utcnow().replace(tzinfo=timezone.utc).isoformat()
    output_dir = Path(args.output_dir)

    if not args.skip_json:
        json_payload = {
            "fetched_at": fetched_at,
            "corp_id": args.corp_id,
            "group_count": len(groups),
            "groups": groups,
        }
        write_json(output_dir / args.json_name, json_payload)

    if not args.skip_csv:
        write_csv(output_dir / args.csv_name, flat_records)

    logging.info("Finished. %d members recorded across %d groups.", len(flat_records), len(groups))
    return 0


if __name__ == "__main__":
    sys.exit(main())
