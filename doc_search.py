#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Local document indexing and keyword search with highlights.
"""

from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Set


DEFAULT_EXTENSIONS = {".md", ".markdown", ".txt"}
TOKEN_RE = re.compile(r"[A-Za-z0-9_]+|[\u4e00-\u9fff]")
WHITESPACE_RE = re.compile(r"\s+")


@dataclass
class Document:
    doc_id: int
    path: str
    title: str
    text: str


def _read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="ignore")


def _collapse_whitespace(text: str) -> str:
    return WHITESPACE_RE.sub(" ", text).strip()


def _normalize(text: str) -> str:
    return _collapse_whitespace(text).lower()


def _extract_title(text: str, fallback: str) -> str:
    for line in text.splitlines():
        line = line.strip()
        if line.startswith("#"):
            title = line.lstrip("#").strip()
            if title:
                return title
    return fallback


def _tokenize(text: str) -> List[str]:
    return TOKEN_RE.findall(text.lower())


def _should_skip(path: Path) -> bool:
    for part in path.parts:
        if part.startswith("."):
            return True
        if part in {"node_modules", "__pycache__", "target"}:
            return True
    return False


def _iter_files(source_paths: Iterable[Path], extensions: Set[str]) -> Iterable[Path]:
    for source in source_paths:
        if not source.exists():
            continue
        if source.is_file():
            if source.suffix.lower() in extensions and not _should_skip(source):
                yield source
            continue
        for file_path in source.rglob("*"):
            if file_path.is_file() and file_path.suffix.lower() in extensions:
                if not _should_skip(file_path):
                    yield file_path


def build_index(source_paths: List[str], output_path: str, extensions: Set[str]) -> None:
    root = Path.cwd().resolve()
    documents: List[Document] = []
    inverted_index: Dict[str, Set[int]] = {}

    for file_path in _iter_files([Path(p) for p in source_paths], extensions):
        text = _read_text(file_path)
        if not text.strip():
            continue
        rel_path = os.path.relpath(file_path.resolve(), root)
        title = _extract_title(text, file_path.stem)
        doc_id = len(documents)
        documents.append(Document(doc_id, rel_path, title, text))

        for token in set(_tokenize(text)):
            inverted_index.setdefault(token, set()).add(doc_id)

    index_payload = {
        "version": 1,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "root": str(root),
        "extensions": sorted(extensions),
        "documents": [
            {
                "id": doc.doc_id,
                "path": doc.path,
                "title": doc.title,
                "text": doc.text,
                "length": len(doc.text),
            }
            for doc in documents
        ],
        "inverted_index": {token: sorted(ids) for token, ids in inverted_index.items()},
    }

    with open(output_path, "w", encoding="utf-8") as handle:
        json.dump(index_payload, handle, ensure_ascii=False, indent=2)

    print(f"Indexed {len(documents)} document(s) -> {output_path}")


def _load_index(index_path: str) -> Dict:
    with open(index_path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def _prepare_terms(query: str) -> List[str]:
    if not query.strip():
        return []
    return _tokenize(query)


def _collect_candidates(index_data: Dict, terms: List[str], mode: str) -> Set[int]:
    if not terms:
        return set(range(len(index_data["documents"])))
    index = index_data["inverted_index"]
    term_sets = [set(index.get(term, [])) for term in terms]
    if not term_sets:
        return set()
    if mode == "any":
        return set().union(*term_sets)
    return set.intersection(*term_sets)


def _build_regex(terms: List[str], case_sensitive: bool) -> re.Pattern:
    escaped_terms = sorted({re.escape(term) for term in terms}, key=len, reverse=True)
    if not escaped_terms:
        return re.compile(r"$^")
    flags = 0 if case_sensitive else re.IGNORECASE
    return re.compile(r"(" + "|".join(escaped_terms) + r")", flags=flags)


def _highlight(text: str, terms: List[str], start_tag: str, end_tag: str, case_sensitive: bool) -> str:
    regex = _build_regex(terms, case_sensitive)
    return regex.sub(lambda match: f"{start_tag}{match.group(0)}{end_tag}", text)


def _count_occurrences(text: str, terms: List[str], case_sensitive: bool) -> int:
    if not terms:
        return 0
    regex = _build_regex(terms, case_sensitive)
    return len(regex.findall(text))


def _build_snippet(
    text: str,
    terms: List[str],
    context: int,
    start_tag: str,
    end_tag: str,
    case_sensitive: bool,
) -> str:
    if not text:
        return ""
    display_text = _collapse_whitespace(text)
    regex = _build_regex(terms, case_sensitive)
    match = regex.search(display_text)
    if not match:
        snippet = display_text[: context * 2]
        return _highlight(snippet, terms, start_tag, end_tag, case_sensitive)
    start = max(match.start() - context, 0)
    end = min(match.end() + context, len(display_text))
    snippet = display_text[start:end]
    snippet = _highlight(snippet, terms, start_tag, end_tag, case_sensitive)
    if start > 0:
        snippet = "..." + snippet
    if end < len(display_text):
        snippet = snippet + "..."
    return snippet


def search_index(
    index_path: str,
    query: str,
    mode: str,
    phrase: bool,
    case_sensitive: bool,
    context: int,
    limit: int,
    start_tag: str,
    end_tag: str,
) -> List[Dict]:
    index_data = _load_index(index_path)
    documents = index_data["documents"]
    terms = _prepare_terms(query)

    candidates = _collect_candidates(index_data, terms, mode) if not phrase else _collect_candidates(index_data, terms, "all")

    results: List[Dict] = []
    for doc_id in candidates:
        doc = documents[doc_id]
        raw_text = doc["text"]
        display_text = _normalize(raw_text)
        needle = _normalize(query) if not case_sensitive else _collapse_whitespace(query)

        if phrase:
            if needle not in display_text:
                continue
            score = display_text.count(needle)
            highlight_terms = [query]
        else:
            score = _count_occurrences(raw_text, terms, case_sensitive)
            highlight_terms = terms

        snippet = _build_snippet(
            raw_text,
            highlight_terms,
            context,
            start_tag,
            end_tag,
            case_sensitive,
        )
        results.append(
            {
                "id": doc_id,
                "path": doc["path"],
                "title": doc["title"],
                "score": score,
                "snippet": snippet,
            }
        )

    results.sort(key=lambda item: (-item["score"], item["path"]))
    return results[:limit] if limit else results


def _print_results(results: List[Dict]) -> None:
    if not results:
        print("No matches found.")
        return
    print(f"Found {len(results)} result(s):")
    for idx, result in enumerate(results, start=1):
        print(f"{idx}. {result['title']} ({result['path']}) [score: {result['score']}]")
        if result["snippet"]:
            print(f"   {result['snippet']}")


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build a local document index and search with highlights."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    build_parser = subparsers.add_parser("build", help="Build index from local documents")
    build_parser.add_argument(
        "--source",
        "-s",
        action="append",
        required=True,
        help="Source directory or file (can be repeated)",
    )
    build_parser.add_argument(
        "--index",
        "-i",
        required=True,
        help="Path to output index JSON file",
    )
    build_parser.add_argument(
        "--ext",
        action="append",
        help="File extension to include (default: .md, .markdown, .txt)",
    )

    search_parser = subparsers.add_parser("search", help="Search in an existing index")
    search_parser.add_argument(
        "--index",
        "-i",
        required=True,
        help="Path to index JSON file",
    )
    search_parser.add_argument(
        "--query",
        "-q",
        required=True,
        help="Keyword or phrase to search",
    )
    search_parser.add_argument(
        "--mode",
        choices=["all", "any"],
        default="all",
        help="Match all terms or any term (default: all)",
    )
    search_parser.add_argument(
        "--phrase",
        action="store_true",
        help="Treat the query as a phrase (substring match)",
    )
    search_parser.add_argument(
        "--case-sensitive",
        action="store_true",
        help="Enable case sensitive matching",
    )
    search_parser.add_argument(
        "--context",
        type=int,
        default=50,
        help="Context characters around highlight (default: 50)",
    )
    search_parser.add_argument(
        "--limit",
        type=int,
        default=20,
        help="Maximum number of results (default: 20)",
    )
    search_parser.add_argument(
        "--highlight-start",
        default="<mark>",
        help="Highlight start tag (default: <mark>)",
    )
    search_parser.add_argument(
        "--highlight-end",
        default="</mark>",
        help="Highlight end tag (default: </mark>)",
    )
    search_parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON",
    )

    return parser.parse_args()


def main() -> None:
    args = _parse_args()
    if args.command == "build":
        extensions = (
            {ext if ext.startswith(".") else f".{ext}" for ext in args.ext}
            if args.ext
            else DEFAULT_EXTENSIONS
        )
        build_index(args.source, args.index, extensions)
        return

    results = search_index(
        index_path=args.index,
        query=args.query,
        mode=args.mode,
        phrase=args.phrase,
        case_sensitive=args.case_sensitive,
        context=args.context,
        limit=args.limit,
        start_tag=args.highlight_start,
        end_tag=args.highlight_end,
    )
    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        _print_results(results)


if __name__ == "__main__":
    main()
