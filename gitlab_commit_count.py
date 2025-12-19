#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""GitLab 提交次数统计（按作者聚合）。

功能：
- 支持按 group 统计（自动遍历 group 下所有项目，可包含子组）
- 支持按 project 列表统计
- 支持时间范围（since/until）、分支（ref_name）
- 输出到控制台表格或 CSV

准备：
- 生成 GitLab Access Token（至少 read_api 权限）

示例：
  # 统计某个 group 下所有项目（含子组），按 email 汇总
  python3 gitlab_commit_count.py \
    --gitlab-url https://gitlab.example.com \
    --token $GITLAB_TOKEN \
    --group-id 12345 \
    --include-subgroups \
    --since 2025-01-01 --until 2025-12-31 \
    --by email

  # 统计指定项目（多个 project id）
  python3 gitlab_commit_count.py --gitlab-url https://gitlab.example.com --token $GITLAB_TOKEN \
    --project-ids 1001,1002,1003 --since 2025-10-01 --by both

  # 输出 CSV
  python3 gitlab_commit_count.py ... --csv out.csv

说明：
- GitLab 的 commits API 统计的是“提交记录”，不是“行数/增删行”。
- 同一个人如果使用不同邮箱/名字提交，会被视为不同作者（可用 --by name/email/both 调整）。
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Tuple


@dataclass(frozen=True)
class Project:
    id: int
    path_with_namespace: str
    default_branch: Optional[str]


def _join_url(base: str, path: str) -> str:
    base = base.rstrip("/")
    path = path.lstrip("/")
    return f"{base}/{path}"


def _parse_iso_date(value: Optional[str], field_name: str) -> Optional[str]:
    if not value:
        return None
    # Accept YYYY-MM-DD; convert to ISO8601 date (GitLab accepts date strings).
    try:
        dt.date.fromisoformat(value)
    except ValueError as e:
        raise SystemExit(f"Invalid {field_name}: {value!r}. Expected YYYY-MM-DD") from e
    return value


class GitLabClient:
    def __init__(self, gitlab_url: str, token: str, timeout_sec: int = 60, rate_limit_sleep_sec: float = 1.0):
        self.base_api = _join_url(gitlab_url, "/api/v4")
        self.token = token
        self.timeout_sec = timeout_sec
        self.rate_limit_sleep_sec = rate_limit_sleep_sec

    def _request_json(self, path: str, query: Optional[Dict[str, Any]] = None) -> Tuple[Any, Dict[str, str]]:
        url = _join_url(self.base_api, path)
        if query:
            # Drop None values
            q = {k: v for k, v in query.items() if v is not None}
            url = f"{url}?{urllib.parse.urlencode(q, doseq=True)}"

        headers = {
            "PRIVATE-TOKEN": self.token,
            "Accept": "application/json",
            "User-Agent": "gitlab-commit-count/1.0",
        }

        req = urllib.request.Request(url, headers=headers, method="GET")
        try:
            with urllib.request.urlopen(req, timeout=self.timeout_sec) as resp:
                raw = resp.read().decode("utf-8")
                data = json.loads(raw) if raw else None
                resp_headers = {k: v for k, v in resp.headers.items()}
                return data, resp_headers
        except urllib.error.HTTPError as e:
            body = ""
            try:
                body = e.read().decode("utf-8")
            except Exception:
                pass
            raise SystemExit(
                f"GitLab API request failed: {e.code} {e.reason}. URL={url}\nResponse body: {body[:2000]}"
            ) from e
        except urllib.error.URLError as e:
            raise SystemExit(f"GitLab API request failed: {e}. URL={url}") from e

    def paged_get(self, path: str, query: Optional[Dict[str, Any]] = None) -> Iterable[Any]:
        page = 1
        per_page = 100
        while True:
            q = dict(query or {})
            q.update({"per_page": per_page, "page": page})
            data, headers = self._request_json(path, q)
            if not isinstance(data, list):
                # Some endpoints may return dict
                yield data
                return

            for item in data:
                yield item

            next_page = headers.get("X-Next-Page")
            if not next_page:
                return
            # Avoid hammering rate limits
            time.sleep(self.rate_limit_sleep_sec)
            page = int(next_page)

    def get_group_projects(self, group_id: int, include_subgroups: bool, archived: bool = False) -> List[Project]:
        projects: List[Project] = []
        for p in self.paged_get(
            f"/groups/{group_id}/projects",
            {
                "include_subgroups": "true" if include_subgroups else "false",
                "archived": "true" if archived else "false",
                "simple": "true",
                "order_by": "path",
                "sort": "asc",
            },
        ):
            if not isinstance(p, dict):
                continue
            pid = int(p.get("id"))
            projects.append(
                Project(
                    id=pid,
                    path_with_namespace=str(p.get("path_with_namespace", pid)),
                    default_branch=p.get("default_branch"),
                )
            )
        return projects

    def iter_project_commits(
        self,
        project_id: int,
        since: Optional[str],
        until: Optional[str],
        ref_name: Optional[str],
        with_stats: bool = False,
    ) -> Iterable[Dict[str, Any]]:
        # ref_name: branch or tag
        # with_stats: include additions/deletions per commit (heavier)
        query = {
            "since": since,
            "until": until,
            "ref_name": ref_name,
            "with_stats": "true" if with_stats else None,
        }
        for c in self.paged_get(f"/projects/{project_id}/repository/commits", query):
            if isinstance(c, dict):
                yield c


def _normalize_author(commit: Dict[str, Any]) -> Tuple[str, str]:
    name = (commit.get("author_name") or "").strip()
    email = (commit.get("author_email") or "").strip().lower()
    # Fallbacks
    if not name:
        name = "<unknown>"
    if not email:
        email = "<unknown>"
    return name, email


def _print_table(rows: List[Dict[str, Any]]) -> None:
    if not rows:
        print("No commits found.")
        return

    cols = ["rank", "count", "author_key", "author_name", "author_email"]
    widths = {c: len(c) for c in cols}
    for r in rows:
        for c in cols:
            widths[c] = max(widths[c], len(str(r.get(c, ""))))

    def fmt_row(r: Dict[str, Any]) -> str:
        return "  ".join(str(r.get(c, "")).ljust(widths[c]) for c in cols)

    print(fmt_row({c: c for c in cols}))
    print("  ".join("-" * widths[c] for c in cols))
    for r in rows:
        print(fmt_row(r))


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="统计 GitLab 每个人提交次数（按作者聚合）。")
    parser.add_argument("--gitlab-url", required=True, help="GitLab base URL, e.g. https://gitlab.example.com")
    parser.add_argument("--token", required=True, help="GitLab access token (read_api)")

    scope = parser.add_mutually_exclusive_group(required=True)
    scope.add_argument("--group-id", type=int, help="Group ID")
    scope.add_argument("--project-ids", help="Comma-separated project IDs, e.g. 1,2,3")

    parser.add_argument("--include-subgroups", action="store_true", help="Include subgroup projects when using --group-id")
    parser.add_argument("--archived", action="store_true", help="Include archived projects when using --group-id")

    parser.add_argument("--since", help="Start date (YYYY-MM-DD)")
    parser.add_argument("--until", help="End date (YYYY-MM-DD)")
    parser.add_argument("--ref", dest="ref_name", help="Branch/tag name to query (ref_name)")

    parser.add_argument("--by", choices=["email", "name", "both"], default="email", help="Aggregate key")
    parser.add_argument("--csv", dest="csv_path", help="Write output as CSV")

    args = parser.parse_args(argv)

    since = _parse_iso_date(args.since, "--since")
    until = _parse_iso_date(args.until, "--until")

    client = GitLabClient(args.gitlab_url, args.token)

    projects: List[Project] = []
    if args.group_id is not None:
        projects = client.get_group_projects(args.group_id, include_subgroups=args.include_subgroups, archived=args.archived)
        if not projects:
            print("No projects found in group.", file=sys.stderr)
    else:
        pids = [p.strip() for p in (args.project_ids or "").split(",") if p.strip()]
        if not pids:
            raise SystemExit("--project-ids is empty")
        projects = [Project(id=int(pid), path_with_namespace=str(pid), default_branch=None) for pid in pids]

    counts: Dict[str, Dict[str, Any]] = {}
    total_commits = 0

    for proj in projects:
        for commit in client.iter_project_commits(
            proj.id,
            since=since,
            until=until,
            ref_name=args.ref_name,
            with_stats=False,
        ):
            total_commits += 1
            name, email = _normalize_author(commit)

            if args.by == "email":
                key = email
            elif args.by == "name":
                key = name
            else:
                key = f"{name} <{email}>"

            if key not in counts:
                counts[key] = {
                    "author_key": key,
                    "author_name": name,
                    "author_email": email,
                    "count": 0,
                }
            counts[key]["count"] += 1

    # Sort: desc count, then key
    items = sorted(counts.values(), key=lambda r: (-int(r["count"]), str(r["author_key"]).lower()))
    rows: List[Dict[str, Any]] = []
    for idx, r in enumerate(items, start=1):
        rows.append(
            {
                "rank": idx,
                "count": r["count"],
                "author_key": r["author_key"],
                "author_name": r["author_name"],
                "author_email": r["author_email"],
            }
        )

    if args.csv_path:
        with open(args.csv_path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=["rank", "count", "author_key", "author_name", "author_email"])
            w.writeheader()
            w.writerows(rows)
        print(f"Wrote CSV: {args.csv_path}")
    else:
        _print_table(rows)

    print(f"\nProjects: {len(projects)}, Total commits: {total_commits}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
