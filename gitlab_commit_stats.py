#!/usr/bin/env python3
"""
Command-line utility for GitLab administrators to aggregate commit counts per user
across daily, weekly, and monthly buckets.

Example:
    python gitlab_commit_stats.py --base-url https://gitlab.example.com \
        --token $GITLAB_TOKEN --group-id 42 --include-subgroups

The script supports either a group (and all accessible projects inside it) or an
explicit list of project IDs supplied via --project-id (repeatable).

Outputs a human-readable breakdown by default; pass --output json for JSON.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
from collections import defaultdict
from typing import DefaultDict, Dict, Iterable, Iterator, List, Optional

import requests


class GitLabClient:
    """Minimal GitLab REST client with pagination support."""

    def __init__(self, base_url: str, token: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        # Prefer PRIVATE-TOKEN header (PAT), fall back to Bearer when PAT not supplied.
        if token.startswith("glpat-") or token.startswith("glpersonal-"):
            self.session.headers["PRIVATE-TOKEN"] = token
        else:
            # Many self-hosted instances still prefer PRIVATE-TOKEN, so keep both.
            self.session.headers["PRIVATE-TOKEN"] = token
            self.session.headers["Authorization"] = f"Bearer {token}"

    def paginated_get(
        self, path: str, params: Optional[Dict[str, object]] = None
    ) -> Iterator[dict]:
        url = f"{self.base_url}{path}"
        next_params = params.copy() if params else {}
        while url:
            response = self.session.get(url, params=next_params, timeout=30)
            try:
                response.raise_for_status()
            except requests.HTTPError as exc:
                raise RuntimeError(
                    f"GitLab API request failed ({response.status_code}): {response.text}"
                ) from exc

            items = response.json()
            if isinstance(items, dict):
                yield items
            else:
                yield from items

            next_link = response.links.get("next", {}).get("url")
            url = next_link
            next_params = None  # Subsequent requests already include query params.


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Aggregate GitLab commit counts per user (daily/weekly/monthly)."
    )
    parser.add_argument(
        "--base-url",
        default=os.getenv("GITLAB_BASE_URL", "").rstrip("/"),
        help="Base URL of the GitLab instance (e.g., https://gitlab.example.com). "
        "Can also be supplied via GITLAB_BASE_URL env var.",
    )
    parser.add_argument(
        "--token",
        default=os.getenv("GITLAB_TOKEN"),
        help="GitLab personal access token with api scope. "
        "Can also be supplied via GITLAB_TOKEN env var.",
    )
    parser.add_argument(
        "--group-id",
        type=int,
        help="Group ID whose projects should be analysed (optional if --project-id used).",
    )
    parser.add_argument(
        "--project-id",
        dest="project_ids",
        action="append",
        help="Project ID to include. Repeat the flag for multiple projects. "
        "If omitted, --group-id must be provided.",
    )
    parser.add_argument(
        "--include-subgroups",
        action="store_true",
        help="Include projects from subgroups when using --group-id.",
    )
    parser.add_argument(
        "--since",
        help="Start date (inclusive) in YYYY-MM-DD. Defaults to 90 days before --until.",
    )
    parser.add_argument(
        "--until",
        help="End date (exclusive) in YYYY-MM-DD. Defaults to tomorrow (UTC).",
    )
    parser.add_argument(
        "--output",
        choices=("table", "json"),
        default="table",
        help="Output format. Defaults to 'table'.",
    )
    parser.add_argument(
        "--max-projects",
        type=int,
        help="Optional safety limit on number of projects to inspect.",
    )
    return parser.parse_args()


def validate_args(args: argparse.Namespace) -> None:
    if not args.base_url:
        raise SystemExit("Error: --base-url or GITLAB_BASE_URL must be provided.")
    if not args.token:
        raise SystemExit("Error: --token or GITLAB_TOKEN must be provided.")
    if not args.group_id and not args.project_ids:
        raise SystemExit("Error: provide either --group-id or at least one --project-id.")


def parse_date(date_str: str, *, default: Optional[dt.date] = None) -> dt.date:
    if not date_str:
        if default is None:
            raise ValueError("No date string provided and no default available.")
        return default
    try:
        return dt.datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValueError(f"Invalid date '{date_str}'. Expected format YYYY-MM-DD.") from exc


def daterange_to_iso(since: dt.datetime, until: dt.datetime) -> Tuple[str, str]:
    return since.isoformat() + "Z", until.isoformat() + "Z"


def parse_gitlab_datetime(value: str) -> dt.datetime:
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    return dt.datetime.fromisoformat(value)


def iso_week_label(timestamp: dt.datetime) -> str:
    iso_year, iso_week, _ = timestamp.isocalendar()
    return f"{iso_year}-W{iso_week:02d}"


def month_label(timestamp: dt.datetime) -> str:
    return timestamp.strftime("%Y-%m")


def fetch_project_ids_from_group(
    client: GitLabClient, group_id: int, include_subgroups: bool
) -> List[int]:
    params = {
        "include_subgroups": include_subgroups,
        "with_shared": False,
        "per_page": 100,
        "archived": False,
        "simple": True,
        "order_by": "name",
    }
    projects = [
        project["id"]
        for project in client.paginated_get(f"/api/v4/groups/{group_id}/projects", params)
    ]
    return projects


def fetch_commits_for_project(
    client: GitLabClient, project_id: int, since_iso: str, until_iso: str
) -> Iterable[dict]:
    params = {
        "since": since_iso,
        "until": until_iso,
        "per_page": 100,
        "with_stats": "false",
        "order": "desc",
    }
    return client.paginated_get(f"/api/v4/projects/{project_id}/repository/commits", params)


def aggregate_commits(
    client: GitLabClient,
    project_ids: List[int],
    since_dt: dt.datetime,
    until_dt: dt.datetime,
) -> DefaultDict[str, Dict[str, DefaultDict[str, int]]]:
    since_iso, until_iso = daterange_to_iso(since_dt, until_dt)

    author_counts: DefaultDict[str, Dict[str, DefaultDict[str, int]]] = defaultdict(
        lambda: {
            "daily": defaultdict(int),
            "weekly": defaultdict(int),
            "monthly": defaultdict(int),
            "total": defaultdict(int),
        }
    )

    for project_id in project_ids:
        for commit in fetch_commits_for_project(client, project_id, since_iso, until_iso):
            author_name = commit.get("author_name") or "Unknown"
            author_email = commit.get("author_email")
            author_key = (
                f"{author_name} <{author_email}>"
                if author_email
                else author_name
            )
            committed_at = parse_gitlab_datetime(commit["committed_date"])

            day_key = committed_at.date().isoformat()
            week_key = iso_week_label(committed_at)
            month_key = month_label(committed_at)

            buckets = author_counts[author_key]
            buckets["daily"][day_key] += 1
            buckets["weekly"][week_key] += 1
            buckets["monthly"][month_key] += 1
            buckets["total"]["all"] += 1

    return author_counts


def counts_to_json(
    author_counts: Dict[str, Dict[str, Dict[str, int]]],
) -> Dict[str, Dict[str, Dict[str, int]]]:
    formatted: Dict[str, Dict[str, Dict[str, int]]] = {}
    for author, buckets in sorted(author_counts.items()):
        formatted[author] = {
            "daily": dict(sorted(buckets["daily"].items())),
            "weekly": dict(sorted(buckets["weekly"].items())),
            "monthly": dict(sorted(buckets["monthly"].items())),
            "total": dict(sorted(buckets["total"].items())),
        }
    return formatted


def print_table(
    author_counts: Dict[str, Dict[str, Dict[str, int]]],
    since_dt: dt.datetime,
    until_dt: dt.datetime,
    project_ids: List[int],
) -> None:
    print("GitLab commit statistics")
    print(f"  Projects analysed: {', '.join(str(pid) for pid in project_ids)}")
    print(f"  Date range      : {since_dt.date()} to {until_dt.date()} (exclusive)")

    if not author_counts:
        print("\nNo commits found in the selected range.")
        return

    for timeframe in ("daily", "weekly", "monthly"):
        print(f"\n=== {timeframe.capitalize()} breakdown ===")
        any_data = False
        for author, buckets in sorted(author_counts.items()):
            if not buckets[timeframe]:
                continue
            any_data = True
            print(f"\nAuthor: {author}")
            total = 0
            for bucket_key, count in sorted(buckets[timeframe].items()):
                print(f"  {bucket_key}: {count}")
                total += count
            print(f"  Total ({timeframe} buckets): {total}")
        if not any_data:
            print("No commits.")

    print("\n=== Overall totals ===")
    for author, buckets in sorted(author_counts.items()):
        overall = buckets["total"].get("all", 0)
        print(f"  {author}: {overall}")


def main() -> None:
    args = parse_args()
    validate_args(args)

    base_url = args.base_url
    token = args.token

    until_default = dt.date.today() + dt.timedelta(days=1)
    until_date = parse_date(args.until, default=until_default)
    since_default = until_date - dt.timedelta(days=90)
    since_date = parse_date(args.since, default=since_default)

    since_dt = dt.datetime.combine(since_date, dt.time.min)
    until_dt = dt.datetime.combine(until_date, dt.time.min)

    if since_dt >= until_dt:
        raise SystemExit("Error: --since must be earlier than --until.")

    client = GitLabClient(base_url, token)

    project_ids: List[int] = []
    if args.group_id:
        project_ids.extend(
            fetch_project_ids_from_group(client, args.group_id, args.include_subgroups)
        )
        if args.max_projects and len(project_ids) > args.max_projects:
            project_ids = project_ids[: args.max_projects]
            print(
                f"Warning: limiting to first {args.max_projects} projects. "
                f"Increase --max-projects to include more."
            )

    if args.project_ids:
        project_ids.extend(int(pid) for pid in args.project_ids)

    project_ids = sorted(set(project_ids))
    if not project_ids:
        raise SystemExit("No projects found to analyse.")

    author_counts = aggregate_commits(client, project_ids, since_dt, until_dt)

    if args.output == "json":
        print(json.dumps(counts_to_json(author_counts), indent=2, ensure_ascii=False))
    else:
        print_table(author_counts, since_dt, until_dt, project_ids)


if __name__ == "__main__":
    main()
