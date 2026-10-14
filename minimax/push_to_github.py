#!/usr/bin/env python3
"""
∆One2lv∆ GitHub Push Utility
Pushes local files to a GitHub repo via the GitHub API (no git CLI required).

Usage:
  python3 push_to_github.py [OPTIONS] <sandbox_dir>

Options:
  --repo    REPO      owner/repo  (default: one2lv-com/minimax)
  --branch  BRANCH    target branch (default: main)
  --pat     TOKEN     GitHub personal access token (or set GITHUB_PAT env var)
  --msg     MESSAGE   commit message
  --no-dist           skip pushing dist/ folder
  --files   glob,...  comma-separated glob patterns (overrides defaults)

Examples:
  python3 push_to_github.py artifacts/mockup-sandbox
  python3 push_to_github.py --msg "feat: new tab" artifacts/mockup-sandbox
  python3 push_to_github.py --no-dist artifacts/mockup-sandbox
"""

import argparse
import base64
import glob
import json
import os
import sys
import urllib.error
import urllib.request

# ── Default file patterns to push ──────────────────────────────
DEFAULT_SOURCE_PATTERNS = [
    "{sandbox}/src/**/*",
    "{sandbox}/public/**/*",
    "{sandbox}/index.html",
    "{sandbox}/package.json",
    "{sandbox}/vite.config.ts",
    "{sandbox}/tsconfig.json",
    "{sandbox}/components.json",
    "{sandbox}/mockupPreviewPlugin.ts",
]

DEFAULT_DIST_PATTERNS = [
    "{sandbox}/dist/**/*",
]

# ── Standalone source files (not inside sandbox) ───────────────
EXTRA_SOURCE_FILES = [
    "one2lv-witness-v8/one2lv_witness_agentic.html",
    "build_and_push.sh",
    "push_to_github.py",
]


def api(method, endpoint, body=None, pat="", verbose=False):
    url = f"https://api.github.com/{endpoint}"
    headers = {
        "Authorization": f"Bearer {pat}",
        "Content-Type": "application/json",
        "User-Agent": "one2lv-push-utility",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        print(f"\n❌  GitHub API error {e.code}: {err_body[:300]}", file=sys.stderr)
        sys.exit(1)


def collect_files(sandbox, include_dist=True, extra_patterns=None):
    patterns = list(DEFAULT_SOURCE_PATTERNS)
    if include_dist:
        patterns += DEFAULT_DIST_PATTERNS
    if extra_patterns:
        patterns += extra_patterns

    paths = set()
    for pattern in patterns:
        resolved = pattern.format(sandbox=sandbox)
        for p in glob.glob(resolved, recursive=True):
            if os.path.isfile(p):
                paths.add(p)

    # Extra standalone files
    for f in EXTRA_SOURCE_FILES:
        if os.path.isfile(f):
            paths.add(f)

    # Exclude node_modules and .git
    paths = {
        p for p in paths
        if "node_modules" not in p
        and "/.git/" not in p
        and not p.endswith(".git")
    }

    return sorted(paths)


def push_files(files, repo, branch, pat, msg):
    print(f"  Fetching HEAD of {repo}@{branch}...")
    ref = api("GET", f"repos/{repo}/git/ref/heads/{branch}", pat=pat)
    head_sha = ref["object"]["sha"]
    commit_info = api("GET", f"repos/{repo}/git/commits/{head_sha}", pat=pat)
    base_tree = commit_info["tree"]["sha"]
    print(f"  HEAD: {head_sha[:10]}  tree: {base_tree[:10]}")
    print(f"  Uploading {len(files)} file(s)...\n")

    tree_items = []
    for i, path in enumerate(files, 1):
        try:
            with open(path, "rb") as f:
                content = f.read()
        except OSError as e:
            print(f"  ⚠  Skip {path}: {e}")
            continue

        blob = api(
            "POST",
            f"repos/{repo}/git/blobs",
            body={"content": base64.b64encode(content).decode(), "encoding": "base64"},
            pat=pat,
        )
        tree_items.append({
            "path": path,
            "mode": "100644",
            "type": "blob",
            "sha": blob["sha"],
        })
        bar = "█" * (i * 20 // len(files)) + "░" * (20 - i * 20 // len(files))
        print(f"  [{bar}] {i:>3}/{len(files)}  {path[-55:]}", end="\r")

    print()
    print(f"\n  Building tree ({len(tree_items)} blobs)...")
    tree = api(
        "POST",
        f"repos/{repo}/git/trees",
        body={"base_tree": base_tree, "tree": tree_items},
        pat=pat,
    )

    print(f"  Creating commit...")
    new_commit = api(
        "POST",
        f"repos/{repo}/git/commits",
        body={"message": msg, "tree": tree["sha"], "parents": [head_sha]},
        pat=pat,
    )

    api(
        "PATCH",
        f"repos/{repo}/git/refs/heads/{branch}",
        body={"sha": new_commit["sha"]},
        pat=pat,
    )

    return new_commit["sha"]


def main():
    parser = argparse.ArgumentParser(description="Push files to GitHub via API")
    parser.add_argument("sandbox", help="Path to sandbox directory (e.g. artifacts/mockup-sandbox)")
    parser.add_argument("--repo",    default="one2lv-com/minimax",   help="owner/repo")
    parser.add_argument("--branch",  default="main",                  help="Target branch")
    parser.add_argument("--pat",     default="",                      help="GitHub PAT (or set GITHUB_PAT env)")
    parser.add_argument("--msg",     default="",                      help="Commit message")
    parser.add_argument("--no-dist", action="store_true",             help="Skip dist/ output")
    parser.add_argument("--files",   default="",                      help="Extra glob patterns (comma-separated)")
    args = parser.parse_args()

    pat = args.pat or os.environ.get("GITHUB_PAT", "")
    if not pat:
        print("❌  ERROR: provide --pat or set GITHUB_PAT environment variable", file=sys.stderr)
        sys.exit(1)

    extra = [p.strip() for p in args.files.split(",") if p.strip()] if args.files else None
    files = collect_files(args.sandbox, include_dist=not args.no_dist, extra_patterns=extra)

    if not files:
        print("⚠  No files found to push.", file=sys.stderr)
        sys.exit(1)

    msg = args.msg or f"build: Raccoon Orbital HUD — {len(files)} files pushed"

    print(f"\n  Files to push: {len(files)}")
    print(f"  Commit msg  : {msg}\n")

    sha = push_files(files, args.repo, args.branch, pat, msg)
    print(f"\n✓  Committed {sha[:10]} → https://github.com/{args.repo}/tree/{args.branch}")


if __name__ == "__main__":
    main()
