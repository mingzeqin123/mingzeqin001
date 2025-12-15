#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Enterprise Knowledge Base (local, incremental, deduplicated).

Features:
- Incremental ingest: only reprocess changed files (by sha256/size/mtime)
- Exact deduplication: dedupe by normalized chunk hash across all sources
- Search: SQLite FTS5 full-text search (bm25 ranking)

Data is stored under: ./kb_store/kb.sqlite3 by default.
"""

from __future__ import annotations

import argparse
import contextlib
import datetime as _dt
import hashlib
import os
import re
import sqlite3
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Iterator, Sequence


DEFAULT_STORE_DIR = Path("kb_store")
DEFAULT_DB_PATH = DEFAULT_STORE_DIR / "kb.sqlite3"


TEXT_EXTENSIONS = {
    ".md",
    ".txt",
    ".rst",
    ".json",
    ".yaml",
    ".yml",
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".py",
    ".java",
    ".kt",
    ".go",
    ".rb",
    ".php",
    ".c",
    ".cc",
    ".cpp",
    ".h",
    ".hpp",
    ".cs",
    ".sql",
    ".xml",
    ".html",
    ".css",
    ".wxss",
    ".wxml",
    ".toml",
    ".ini",
    ".cfg",
    ".properties",
    ".sh",
    ".bat",
    ".ps1",
}


def _utc_now_iso() -> str:
    return _dt.datetime.now(tz=_dt.timezone.utc).isoformat()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def looks_binary(data: bytes) -> bool:
    if not data:
        return False
    # Heuristic: if NUL bytes exist or too many non-text bytes, treat as binary.
    if b"\x00" in data:
        return True
    sample = data[:4096]
    nontext = sum(1 for b in sample if b < 9 or (13 < b < 32))
    return (nontext / max(1, len(sample))) > 0.15


_WS_RE = re.compile(r"\s+")
_PLAIN_TOKEN_RE = re.compile(r"[0-9A-Za-z_]+|[\u4e00-\u9fff]+")


def normalize_text(text: str) -> str:
    # Normalize whitespace; keep content meaning stable for exact-dedup.
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = _WS_RE.sub(" ", text).strip()
    return text


def plain_text_to_fts_query(q: str) -> str:
    """
    Convert plain user input into a safe FTS5 MATCH query.

    Rationale: FTS5 MATCH has its own query language; punctuation like '.' can error.
    We tokenize into alnum/CJK sequences and join with AND.
    """
    q = q.strip()
    toks = _PLAIN_TOKEN_RE.findall(q)
    if not toks:
        safe = q.replace('"', '""')
        return f"\"{safe}\""
    parts: list[str] = []
    for t in toks:
        safe = t.replace('"', '""')
        parts.append(f"\"{safe}\"")
    return " AND ".join(parts)


def chunk_text(text: str, *, chunk_size: int, chunk_overlap: int) -> Iterator[str]:
    """
    Simple character-based chunker with overlap.
    We chunk normalized text to make dedup stable.
    """
    if chunk_size <= 0:
        raise ValueError("chunk_size must be > 0")
    if chunk_overlap < 0 or chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be >=0 and < chunk_size")

    text = normalize_text(text)
    if not text:
        return

    step = chunk_size - chunk_overlap
    for start in range(0, len(text), step):
        end = min(len(text), start + chunk_size)
        chunk = text[start:end].strip()
        if chunk:
            yield chunk
        if end >= len(text):
            break


@dataclass(frozen=True)
class FileFingerprint:
    path: str
    mtime: int
    size: int
    sha256: str


def fingerprint_file(path: Path) -> FileFingerprint | None:
    try:
        data = path.read_bytes()
    except OSError:
        return None
    if looks_binary(data):
        return None
    st = path.stat()
    return FileFingerprint(
        path=str(path),
        mtime=int(st.st_mtime),
        size=int(st.st_size),
        sha256=sha256_bytes(data),
    )


def iter_source_files(root: Path, *, extensions: set[str], exclude_dirs: set[str]) -> Iterator[Path]:
    root = root.resolve()
    for dirpath, dirnames, filenames in os.walk(root):
        # mutate dirnames in-place to prune
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs and not d.startswith(".")]
        for name in filenames:
            if name.startswith("."):
                continue
            p = Path(dirpath) / name
            if p.suffix.lower() in extensions:
                yield p


SCHEMA_SQL = """
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS kb_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kb_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL UNIQUE,
  mtime INTEGER NOT NULL,
  size INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  ingested_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kb_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chunk_hash TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kb_chunk_occurrences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER NOT NULL,
  chunk_id INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  FOREIGN KEY(file_id) REFERENCES kb_files(id) ON DELETE CASCADE,
  FOREIGN KEY(chunk_id) REFERENCES kb_chunks(id) ON DELETE CASCADE,
  UNIQUE(file_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_occ_chunk_id ON kb_chunk_occurrences(chunk_id);
CREATE INDEX IF NOT EXISTS idx_occ_file_id ON kb_chunk_occurrences(file_id);

-- FTS5 index for chunk content. Uses kb_chunks as content table.
CREATE VIRTUAL TABLE IF NOT EXISTS kb_chunks_fts
USING fts5(content, content='kb_chunks', content_rowid='id', tokenize='unicode61');

-- Keep FTS in sync.
CREATE TRIGGER IF NOT EXISTS kb_chunks_ai AFTER INSERT ON kb_chunks BEGIN
  INSERT INTO kb_chunks_fts(rowid, content) VALUES (new.id, new.content);
END;
CREATE TRIGGER IF NOT EXISTS kb_chunks_ad AFTER DELETE ON kb_chunks BEGIN
  INSERT INTO kb_chunks_fts(kb_chunks_fts, rowid, content) VALUES('delete', old.id, old.content);
END;
CREATE TRIGGER IF NOT EXISTS kb_chunks_au AFTER UPDATE ON kb_chunks BEGIN
  INSERT INTO kb_chunks_fts(kb_chunks_fts, rowid, content) VALUES('delete', old.id, old.content);
  INSERT INTO kb_chunks_fts(rowid, content) VALUES (new.id, new.content);
END;
"""


@contextlib.contextmanager
def db_connect(db_path: Path) -> Iterator[sqlite3.Connection]:
    db_path = db_path.resolve()
    conn = sqlite3.connect(str(db_path))
    try:
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys=ON;")
        yield conn
    finally:
        conn.close()


def db_init(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with db_connect(db_path) as conn:
        conn.executescript(SCHEMA_SQL)
        conn.execute(
            "INSERT OR REPLACE INTO kb_meta(key, value) VALUES(?, ?)",
            ("schema_version", "1"),
        )
        conn.commit()


def db_get_file(conn: sqlite3.Connection, path: str) -> sqlite3.Row | None:
    cur = conn.execute("SELECT * FROM kb_files WHERE path = ?", (path,))
    return cur.fetchone()


def db_upsert_file(conn: sqlite3.Connection, fp: FileFingerprint) -> int:
    existing = db_get_file(conn, fp.path)
    if existing is None:
        cur = conn.execute(
            "INSERT INTO kb_files(path, mtime, size, sha256, ingested_at) VALUES(?, ?, ?, ?, ?)",
            (fp.path, fp.mtime, fp.size, fp.sha256, _utc_now_iso()),
        )
        return int(cur.lastrowid)
    conn.execute(
        "UPDATE kb_files SET mtime=?, size=?, sha256=?, ingested_at=? WHERE id=?",
        (fp.mtime, fp.size, fp.sha256, _utc_now_iso(), int(existing["id"])),
    )
    return int(existing["id"])


def db_delete_file_by_path(conn: sqlite3.Connection, path: str) -> None:
    conn.execute("DELETE FROM kb_files WHERE path = ?", (path,))


def db_clear_occurrences_for_file(conn: sqlite3.Connection, file_id: int) -> None:
    conn.execute("DELETE FROM kb_chunk_occurrences WHERE file_id = ?", (file_id,))


def db_get_or_create_chunk(conn: sqlite3.Connection, chunk_hash: str, content: str) -> int:
    cur = conn.execute("SELECT id FROM kb_chunks WHERE chunk_hash = ?", (chunk_hash,))
    row = cur.fetchone()
    if row is not None:
        return int(row["id"])
    cur = conn.execute(
        "INSERT INTO kb_chunks(chunk_hash, content) VALUES(?, ?)",
        (chunk_hash, content),
    )
    return int(cur.lastrowid)


def db_insert_occurrence(conn: sqlite3.Connection, *, file_id: int, chunk_id: int, chunk_index: int) -> None:
    conn.execute(
        "INSERT OR REPLACE INTO kb_chunk_occurrences(file_id, chunk_id, chunk_index) VALUES(?, ?, ?)",
        (file_id, chunk_id, chunk_index),
    )


def db_prune_orphan_chunks(conn: sqlite3.Connection) -> int:
    cur = conn.execute(
        """
        DELETE FROM kb_chunks
        WHERE id NOT IN (SELECT DISTINCT chunk_id FROM kb_chunk_occurrences)
        """
    )
    return int(cur.rowcount)


def ingest(
    *,
    db_path: Path,
    source: Path,
    chunk_size: int,
    chunk_overlap: int,
    extensions: set[str],
    exclude_dirs: set[str],
    prune: bool,
) -> None:
    if not db_path.exists():
        raise SystemExit(f"DB not found: {db_path}. Run `init` first.")
    source = source.resolve()
    if not source.exists():
        raise SystemExit(f"Source not found: {source}")

    files_on_disk: list[FileFingerprint] = []
    for p in iter_source_files(source, extensions=extensions, exclude_dirs=exclude_dirs):
        fp = fingerprint_file(p)
        if fp is not None:
            files_on_disk.append(fp)

    with db_connect(db_path) as conn:
        conn.execute("BEGIN;")
        try:
            # Optionally prune files no longer present.
            if prune:
                cur = conn.execute("SELECT path FROM kb_files")
                known_paths = {row["path"] for row in cur.fetchall()}
                disk_paths = {fp.path for fp in files_on_disk}
                to_delete = sorted(known_paths - disk_paths)
                for path in to_delete:
                    db_delete_file_by_path(conn, path)

            changed = 0
            skipped = 0
            new_chunks = 0
            occurrences = 0

            for fp in files_on_disk:
                row = db_get_file(conn, fp.path)
                if row is not None and row["sha256"] == fp.sha256 and int(row["size"]) == fp.size:
                    skipped += 1
                    continue

                file_id = db_upsert_file(conn, fp)
                db_clear_occurrences_for_file(conn, file_id)

                try:
                    text = Path(fp.path).read_text(encoding="utf-8", errors="replace")
                except OSError:
                    continue

                for idx, chunk in enumerate(
                    chunk_text(text, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
                ):
                    chash = sha256_text(chunk)
                    # get-or-create unique chunk
                    before = conn.execute(
                        "SELECT 1 FROM kb_chunks WHERE chunk_hash=?",
                        (chash,),
                    ).fetchone()
                    chunk_id = db_get_or_create_chunk(conn, chash, chunk)
                    if before is None:
                        new_chunks += 1
                    db_insert_occurrence(conn, file_id=file_id, chunk_id=chunk_id, chunk_index=idx)
                    occurrences += 1

                changed += 1

            pruned = db_prune_orphan_chunks(conn)
            conn.commit()
        except Exception:
            conn.rollback()
            raise

    print(
        "Ingest completed.\n"
        f"- source: {source}\n"
        f"- changed_files: {changed}\n"
        f"- skipped_files: {skipped}\n"
        f"- new_unique_chunks: {new_chunks}\n"
        f"- total_occurrences_written: {occurrences}\n"
        f"- orphan_chunks_pruned: {pruned}"
    )


def query(*, db_path: Path, q: str, limit: int) -> None:
    if not db_path.exists():
        raise SystemExit(f"DB not found: {db_path}. Run `init` first.")
    q = q.strip()
    if not q:
        raise SystemExit("Query is empty.")
    with db_connect(db_path) as conn:
        rows = conn.execute(
            """
            SELECT
              c.id AS chunk_id,
              c.chunk_hash AS chunk_hash,
              c.content AS content,
              bm25(kb_chunks_fts) AS score
            FROM kb_chunks_fts
            JOIN kb_chunks c ON c.id = kb_chunks_fts.rowid
            WHERE kb_chunks_fts MATCH ?
            ORDER BY score
            LIMIT ?
            """,
            (q, limit),
        ).fetchall()

        if not rows:
            print("No results.")
            return

        for i, r in enumerate(rows, 1):
            occ = conn.execute(
                """
                SELECT f.path, o.chunk_index
                FROM kb_chunk_occurrences o
                JOIN kb_files f ON f.id = o.file_id
                WHERE o.chunk_id = ?
                ORDER BY f.path, o.chunk_index
                LIMIT 5
                """,
                (int(r["chunk_id"]),),
            ).fetchall()
            sources = "; ".join(f"{x['path']}#chunk{int(x['chunk_index'])}" for x in occ)
            snippet = r["content"]
            if len(snippet) > 400:
                snippet = snippet[:400] + " ..."
            print(f"[{i}] score={float(r['score']):.4f} sources={sources}")
            print(snippet)
            print("-" * 80)


def stats(*, db_path: Path) -> None:
    if not db_path.exists():
        raise SystemExit(f"DB not found: {db_path}. Run `init` first.")
    with db_connect(db_path) as conn:
        files = conn.execute("SELECT COUNT(*) AS n FROM kb_files").fetchone()["n"]
        chunks = conn.execute("SELECT COUNT(*) AS n FROM kb_chunks").fetchone()["n"]
        occ = conn.execute("SELECT COUNT(*) AS n FROM kb_chunk_occurrences").fetchone()["n"]
        print(
            "KB stats:\n"
            f"- db: {db_path.resolve()}\n"
            f"- files: {int(files)}\n"
            f"- unique_chunks: {int(chunks)}\n"
            f"- total_occurrences: {int(occ)}"
        )


def dedup(*, db_path: Path) -> None:
    """
    Maintenance command:
    - Remove orphan chunks (no longer referenced by any file occurrence)
    - Rebuild FTS index (keeps search consistent)
    """
    if not db_path.exists():
        raise SystemExit(f"DB not found: {db_path}. Run `init` first.")
    with db_connect(db_path) as conn:
        conn.execute("BEGIN;")
        try:
            pruned = db_prune_orphan_chunks(conn)
            # Rebuild FTS from content table
            conn.execute("INSERT INTO kb_chunks_fts(kb_chunks_fts) VALUES('rebuild')")
            conn.commit()
        except Exception:
            conn.rollback()
            raise
    print(f"Dedup/maintenance completed. orphan_chunks_pruned={pruned}")


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(prog="enterprise_kb", add_help=True)
    p.add_argument("--db", default=str(DEFAULT_DB_PATH), help="Path to SQLite DB (default: kb_store/kb.sqlite3)")

    sub = p.add_subparsers(dest="cmd", required=True)

    sp_init = sub.add_parser("init", help="Initialize the knowledge base DB")
    sp_init.add_argument("--force", action="store_true", help="Overwrite existing DB file")

    sp_ingest = sub.add_parser("ingest", help="Ingest documents incrementally with deduplication")
    sp_ingest.add_argument("--source", default=".", help="Source directory (default: current directory)")
    sp_ingest.add_argument("--chunk-size", type=int, default=1000, help="Chunk size in characters (default: 1000)")
    sp_ingest.add_argument("--chunk-overlap", type=int, default=150, help="Chunk overlap (default: 150)")
    sp_ingest.add_argument(
        "--ext",
        default="",
        help="Comma-separated file extensions to include (override defaults), e.g. .md,.txt,.py",
    )
    sp_ingest.add_argument(
        "--exclude-dir",
        default=".git,node_modules,dist,build,target,__pycache__,kb_store",
        help="Comma-separated dir names to exclude",
    )
    sp_ingest.add_argument("--prune", action="store_true", help="Remove DB entries for files missing on disk")

    sp_query = sub.add_parser("query", help="Full-text search (FTS5)")
    sp_query.add_argument("q", help="Query text (plain text by default; use --fts for raw FTS5 syntax)")
    sp_query.add_argument("--limit", type=int, default=8, help="Max results (default: 8)")
    sp_query.add_argument(
        "--fts",
        action="store_true",
        help="Treat `q` as raw FTS5 MATCH syntax (otherwise plain text will be tokenized/escaped)",
    )

    sub.add_parser("stats", help="Show KB statistics")
    sub.add_parser("dedup", help="Maintenance: prune orphans and rebuild FTS index")

    return p.parse_args(argv)


def main(argv: Sequence[str]) -> int:
    args = parse_args(argv)
    db_path = Path(args.db)

    if args.cmd == "init":
        if db_path.exists():
            if not args.force:
                raise SystemExit(f"DB already exists: {db_path}. Use --force to overwrite.")
            db_path.unlink()
        db_init(db_path)
        print(f"Initialized KB DB at: {db_path.resolve()}")
        return 0

    if args.cmd == "ingest":
        exts = TEXT_EXTENSIONS
        if args.ext.strip():
            exts = {e.strip().lower() for e in args.ext.split(",") if e.strip()}
        exclude_dirs = {d.strip() for d in args.exclude_dir.split(",") if d.strip()}
        ingest(
            db_path=db_path,
            source=Path(args.source),
            chunk_size=int(args.chunk_size),
            chunk_overlap=int(args.chunk_overlap),
            extensions=exts,
            exclude_dirs=exclude_dirs,
            prune=bool(args.prune),
        )
        return 0

    if args.cmd == "query":
        q = str(args.q)
        if not bool(args.fts):
            q = plain_text_to_fts_query(q)
        query(db_path=db_path, q=q, limit=int(args.limit))
        return 0

    if args.cmd == "stats":
        stats(db_path=db_path)
        return 0

    if args.cmd == "dedup":
        dedup(db_path=db_path)
        return 0

    raise SystemExit(f"Unknown command: {args.cmd}")


if __name__ == "__main__":
    try:
        raise SystemExit(main(sys.argv[1:]))
    except BrokenPipeError:
        # Allow piping output without stack traces (e.g., to `head`)
        raise SystemExit(0)
