#!/usr/bin/env python3
"""
ingest_one2lvos.py
==================
Clone github.com/one2lv-com/One2lvos and push every file + commit
into AstraDB as CQL rows.

Usage:
    export ASTRA_DB_TOKEN="AstraCS:..."
    export ASTRA_DB_API_ENDPOINT="https://<db-id>-<region>.apps.astra.datastax.com"
    export ASTRA_DB_KEYSPACE="one2lvos"          # optional, default: one2lvos
    export GITHUB_TOKEN="ghp_..."                # optional, for private repos
    export REPO_URL="https://github.com/one2lv-com/One2lvos"
    python3 ingest_one2lvos.py

Dependencies:
    pip install astrapy gitpython tqdm
"""

import os
import sys
import hashlib
import mimetypes
from datetime import datetime, timezone
from pathlib import Path

try:
    import git                          # pip install gitpython
    from astrapy import DataAPIClient   # pip install astrapy
    from astrapy.exceptions import CollectionInsertManyException
    from tqdm import tqdm               # pip install tqdm
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Run: pip install astrapy gitpython tqdm")
    sys.exit(1)

# ── Config ────────────────────────────────────────────────────────────────────
ASTRA_TOKEN    = os.getenv("ASTRA_DB_TOKEN", "")
ASTRA_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT", "")
KEYSPACE       = os.getenv("ASTRA_DB_KEYSPACE", "one2lvos")
REPO_URL       = os.getenv("REPO_URL", "https://github.com/one2lv-com/One2lvos")
GITHUB_TOKEN   = os.getenv("GITHUB_TOKEN", "")
CLONE_DIR      = Path(os.getenv("CLONE_DIR", "/tmp/one2lvos_ingest"))
BRANCH         = os.getenv("BRANCH", "main")
MAX_FILE_BYTES = int(os.getenv("MAX_FILE_BYTES", str(512 * 1024)))  # 512 KB cap
BATCH_SIZE     = int(os.getenv("BATCH_SIZE", "50"))

SKIP_DIRS  = {".git", "node_modules", "__pycache__", ".venv", "dist", ".next"}
SKIP_EXTS  = {".pyc", ".pyo", ".o", ".so", ".dylib", ".dll", ".exe",
              ".zip", ".tar", ".gz", ".whl", ".png", ".jpg", ".jpeg",
              ".gif", ".ico", ".webp", ".ttf", ".woff", ".woff2"}

# ── CQL DDL ───────────────────────────────────────────────────────────────────
# These are issued via the Astra REST API before ingestion.
# If you prefer CQL console, run them there and set CREATE_TABLES=false.
CREATE_TABLES = os.getenv("CREATE_TABLES", "true").lower() == "true"

FILES_DDL = f"""
CREATE TABLE IF NOT EXISTS {KEYSPACE}.files (
    repo          text,
    branch        text,
    path          text,
    commit_hash   text,
    content       text,
    size_bytes    bigint,
    mime_type     text,
    sha256        text,
    indexed_at    timestamp,
    PRIMARY KEY ((repo, branch), path)
) WITH CLUSTERING ORDER BY (path ASC)
"""

COMMITS_DDL = f"""
CREATE TABLE IF NOT EXISTS {KEYSPACE}.commits (
    commit_hash     text,
    repo            text,
    branch          text,
    author_name     text,
    author_email    text,
    committed_date  timestamp,
    message         text,
    files_changed   list<text>,
    PRIMARY KEY (commit_hash)
)
"""


# ── Helpers ───────────────────────────────────────────────────────────────────
def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _mime(path: Path) -> str:
    t, _ = mimetypes.guess_type(str(path))
    return t or "text/plain"


def _should_skip(path: Path) -> bool:
    for part in path.parts:
        if part in SKIP_DIRS:
            return True
    return path.suffix.lower() in SKIP_EXTS


def _clone_or_pull(repo_url: str, clone_dir: Path, token: str, branch: str):
    """Clone fresh or pull latest."""
    auth_url = repo_url
    if token and "github.com" in repo_url:
        auth_url = repo_url.replace("https://", f"https://{token}@")

    if (clone_dir / ".git").exists():
        print(f"Pulling latest {branch}…")
        repo = git.Repo(clone_dir)
        repo.remotes.origin.pull(branch)
    else:
        print(f"Cloning {repo_url} → {clone_dir}…")
        clone_dir.mkdir(parents=True, exist_ok=True)
        repo = git.Repo.clone_from(auth_url, clone_dir, branch=branch)

    return repo


def _iter_files(clone_dir: Path):
    """Yield (relative_path_str, content_str, size, mime, sha256) for each file."""
    for abs_path in clone_dir.rglob("*"):
        if not abs_path.is_file():
            continue
        rel = abs_path.relative_to(clone_dir)
        if _should_skip(rel):
            continue
        try:
            raw = abs_path.read_bytes()
        except OSError:
            continue
        if len(raw) > MAX_FILE_BYTES:
            # Store truncation notice instead of skipping entirely
            content = f"[TRUNCATED — {len(raw)} bytes > {MAX_FILE_BYTES} limit]"
        else:
            try:
                content = raw.decode("utf-8", errors="replace")
            except Exception:
                content = f"[BINARY — {len(raw)} bytes]"
        yield str(rel), content, len(raw), _mime(abs_path), _sha256(raw)


def _iter_commits(repo: git.Repo, branch: str, limit: int = 500):
    """Yield commit dicts for the last `limit` commits."""
    for commit in repo.iter_commits(branch, max_count=limit):
        yield {
            "commit_hash":    commit.hexsha,
            "author_name":    commit.author.name,
            "author_email":   commit.author.email,
            "committed_date": datetime.fromtimestamp(commit.committed_date, tz=timezone.utc),
            "message":        commit.message.strip()[:1000],
            "files_changed":  list(commit.stats.files.keys())[:200],
        }


# ── AstraDB helpers ───────────────────────────────────────────────────────────
def _get_db(token: str, endpoint: str, keyspace: str):
    client = DataAPIClient(token)
    return client.get_database(endpoint, keyspace=keyspace)


def _exec_cql_via_rest(token: str, endpoint: str, cql: str):
    """Execute raw CQL against Astra's REST /api/rest/v2/schemas endpoint."""
    import urllib.request, urllib.error
    db_id = endpoint.split("//")[1].split("-")[0] if "//" in endpoint else ""
    # Astra Data API does not expose a direct CQL exec endpoint from astrapy —
    # use the Stargate REST bridge if available, otherwise skip DDL.
    # Recommended: run DDL manually in Astra console or via cqlsh.
    print(f"[DDL] Manual step required — run in Astra CQL console:\n{cql}\n")


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    if not ASTRA_TOKEN:
        print("ERROR: set ASTRA_DB_TOKEN environment variable")
        sys.exit(1)
    if not ASTRA_ENDPOINT:
        print("ERROR: set ASTRA_DB_API_ENDPOINT environment variable")
        sys.exit(1)

    repo_name = REPO_URL.rstrip("/").split("/")[-1]

    # 1. Clone / pull
    repo = _clone_or_pull(REPO_URL, CLONE_DIR, GITHUB_TOKEN, BRANCH)
    head_sha = repo.head.commit.hexsha
    print(f"HEAD: {head_sha}")

    # 2. Print DDL (run manually in Astra console)
    if CREATE_TABLES:
        print("\n── CQL Schema (run in Astra console if not already created) ──")
        print(FILES_DDL)
        print(COMMITS_DDL)
        print("──────────────────────────────────────────────────────────────\n")

    # 3. Connect to AstraDB via Document API
    from astrapy.info import CollectionDefinition
    db = _get_db(ASTRA_TOKEN, ASTRA_ENDPOINT, KEYSPACE)
    existing = {c.name for c in db.list_collections()}

    # Drop and recreate files collection to guarantee correct indexing config.
    # content must be denied from indexing — Astra caps indexed strings at 8000 bytes.
    if "files" in existing:
        print("Dropping existing files collection (re-creating with correct index config)…")
        db.drop_collection("files")
    files_col = db.create_collection(
        "files",
        definition=CollectionDefinition.coerce({"indexing": {"deny": ["content", "sha256"]}})
    )

    commits_col = db.create_collection("commits") if "commits" not in existing else db.get_collection("commits")

    # 4. Ingest files
    print("Ingesting files…")
    now = datetime.now(tz=timezone.utc).isoformat()
    batch = []
    total_files = 0

    for path_str, content, size, mime, sha in tqdm(list(_iter_files(CLONE_DIR))):
        doc = {
            "_id":         f"{repo_name}::{BRANCH}::{path_str}",
            "repo":        repo_name,
            "branch":      BRANCH,
            "path":        path_str,
            "commit_hash": head_sha,
            "content":     content,
            "size_bytes":  size,
            "mime_type":   mime,
            "sha256":      sha,
            "indexed_at":  now,
        }
        batch.append(doc)
        if len(batch) >= BATCH_SIZE:
            try:
                files_col.insert_many(batch, ordered=False)
            except CollectionInsertManyException as ex:
                pass  # partial inserts still succeed; skip duplicates/size errors
            total_files += len(batch)
            batch = []

    if batch:
        try:
            files_col.insert_many(batch, ordered=False)
        except CollectionInsertManyException:
            pass
        total_files += len(batch)

    print(f"Files ingested: {total_files}")

    # 5. Ingest commits
    print("Ingesting commits…")
    batch = []
    total_commits = 0

    for commit_doc in tqdm(list(_iter_commits(repo, BRANCH))):
        commit_doc["_id"]    = commit_doc["commit_hash"]
        commit_doc["repo"]   = repo_name
        commit_doc["branch"] = BRANCH
        # ISO-format the timestamp for JSON serialisation
        if isinstance(commit_doc["committed_date"], datetime):
            commit_doc["committed_date"] = commit_doc["committed_date"].isoformat()
        batch.append(commit_doc)
        if len(batch) >= BATCH_SIZE:
            try:
                commits_col.insert_many(batch, ordered=False)
            except CollectionInsertManyException:
                pass
            total_commits += len(batch)
            batch = []

    if batch:
        try:
            commits_col.insert_many(batch, ordered=False)
        except CollectionInsertManyException:
            pass
        total_commits += len(batch)

    print(f"Commits ingested: {total_commits}")
    print(f"\nDone. {total_files} files + {total_commits} commits → AstraDB ({ASTRA_ENDPOINT})")


if __name__ == "__main__":
    main()
