#!/usr/bin/env python3
"""Fetch PR context, prepare AI prompt, and checkout the PR branch.

This script is a thin wrapper around `.github/scripts/prepare_AI_prompt.py`.

What it does:
- Fetches PR details + changed files via GitHub REST API
- Detects `student` and `task` from the changed file paths
- Runs `prepare_AI_prompt.py --student ... --task ...` and prints the prompt
- Optionally checks out the PR head into a local branch `pr-<number>`

Optional mode `--mark`:
- Adds a comment and a label to the PR (requires a token)

Notes for WT-AC-2025-CourseWorks:
- Task folders can be: `task_01`, `task_01_R1`, `task_02`, `task_03`, ...
- Detection supports both `students/<NameLatin>/<task_folder>/...` and
  `students/<NameLatin>/task_XX/...` patterns.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Iterable
import urllib.request
import urllib.error



ROOT = Path(__file__).resolve().parents[2]

# CourseWorks repo is typically hosted under brstu as well; override with --repo when needed.
DEFAULT_REPO = "brstu/WT-AC-2025-CourseWorks"

PREPARE_SCRIPT = ROOT / ".github" / "scripts" / "prepare_AI_prompt.py"


def build_headers(token: str | None) -> dict[str, str]:
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def fetch_pr(repo: str, pr_number: int, token: str | None) -> dict:
    url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}"
    req = urllib.request.Request(url, headers=build_headers(token), method="GET")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        msg = exc.read().decode("utf-8", errors="replace") if getattr(exc, "fp", None) else str(exc)
        raise RuntimeError(f"Failed to fetch PR #{pr_number}: HTTP {exc.code} {msg}") from exc


def fetch_pr_files(repo: str, pr_number: int, token: str | None) -> list[dict]:
    files: list[dict] = []
    page = 1
    while True:
        url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}/files"
        full = f"{url}?page={page}&per_page=100"
        req = urllib.request.Request(full, headers=build_headers(token), method="GET")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8", errors="replace")
                batch = json.loads(raw)
        except urllib.error.HTTPError as exc:
            msg = exc.read().decode("utf-8", errors="replace") if getattr(exc, "fp", None) else str(exc)
            raise RuntimeError(
                f"Failed to fetch files for PR #{pr_number}: HTTP {exc.code} {msg}"
            ) from exc
        if not batch:
            break
        files.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    return files


def post_pr_comment(repo: str, pr_number: int, token: str | None, body: str) -> None:
    """Create an issue comment on the PR."""
    url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments"
    if not token:
        raise RuntimeError("Token is required to post a comment")
    payload = json.dumps({"body": body}).encode("utf-8")
    headers = dict(build_headers(token))
    headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, headers=headers, data=payload, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status not in (200, 201):
                raw = resp.read().decode("utf-8", errors="replace")
                raise RuntimeError(
                    f"Failed to post comment to PR #{pr_number}: HTTP {resp.status} {raw}"
                )
    except urllib.error.HTTPError as exc:
        msg = exc.read().decode("utf-8", errors="replace") if getattr(exc, "fp", None) else str(exc)
        raise RuntimeError(
            f"Failed to post comment to PR #{pr_number}: HTTP {exc.code} {msg}"
        ) from exc


def add_pr_label(repo: str, pr_number: int, token: str | None, label: str) -> None:
    """Add a label to the PR issue."""
    url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/labels"
    if not token:
        raise RuntimeError("Token is required to add a label")
    payload = json.dumps([label]).encode("utf-8")
    headers = dict(build_headers(token))
    headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, headers=headers, data=payload, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status not in (200, 201):
                raw = resp.read().decode("utf-8", errors="replace")
                raise RuntimeError(
                    f"Failed to add label '{label}' to PR #{pr_number}: HTTP {resp.status} {raw}"
                )
    except urllib.error.HTTPError as exc:
        msg = exc.read().decode("utf-8", errors="replace") if getattr(exc, "fp", None) else str(exc)
        raise RuntimeError(
            f"Failed to add label '{label}' to PR #{pr_number}: HTTP {exc.code} {msg}"
        ) from exc


_TASK_FOLDER_RE = re.compile(r"^(task_(\d+)(?:_[A-Za-z0-9][A-Za-z0-9_-]*)?)$")


def _normalize_task_folder(task_segment: str) -> str | None:
    """Return normalized task folder name (preserving suffix like _R1).

    Examples:
    - task_1 -> task_01
    - task_01 -> task_01
    - task_01_R1 -> task_01_R1
    """
    seg = task_segment.strip()
    m = _TASK_FOLDER_RE.match(seg)
    if not m:
        return None
    num = int(m.group(2))
    suffix = seg[len(f"task_{m.group(2)}") :]
    # suffix starts with "_" or empty
    return f"task_{num:02d}{suffix}"


def detect_student_task(paths: Iterable[str]) -> tuple[str, str]:
    pairs: set[tuple[str, str]] = set()
    for path in paths:
        parts = path.split("/")
        if len(parts) < 3 or parts[0] != "students":
            continue
        student = parts[1]
        task_segment = parts[2]
        task_folder = _normalize_task_folder(task_segment)
        if not task_folder:
            continue
        pairs.add((student, task_folder))

    if not pairs:
        raise RuntimeError(
            "Could not detect student/task from PR file list. "
            "Expected paths like 'students/<NameLatin>/task_02/...'."
        )
    if len(pairs) > 1:
        raise RuntimeError(f"Multiple student/task combinations detected: {sorted(pairs)}")
    return pairs.pop()


def run_prepare_script(student: str, task: str) -> str:
    if not PREPARE_SCRIPT.exists():
        raise RuntimeError(f"prepare_AI_prompt.py not found at {PREPARE_SCRIPT}")
    cmd = [sys.executable, str(PREPARE_SCRIPT), "--student", student, "--task", task]
    env = os.environ.copy()
    env.setdefault("PYTHONIOENCODING", "utf-8")
    result = subprocess.run(
        cmd,
        cwd=ROOT,
        capture_output=True,
        text=True,
        env=env,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode != 0:
        raise RuntimeError(
            "prepare_AI_prompt.py failed with code {}: {}".format(
                result.returncode, result.stderr.strip()
            )
        )
    return result.stdout.strip()


def checkout_pr_branch(pr_number: int) -> None:
    """Create/update local branch for PR to the PR head commit."""
    local_branch = f"pr-{pr_number}"
    fetch_ref = f"pull/{pr_number}/head"
    fetch_cmd = ["git", "fetch", "origin", fetch_ref]
    checkout_cmd = ["git", "checkout", "-B", local_branch, "FETCH_HEAD"]
    try:
        subprocess.run(fetch_cmd, cwd=ROOT, check=True)
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(f"git fetch failed: {exc}") from exc
    try:
        subprocess.run(checkout_cmd, cwd=ROOT, check=True)
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(
            "git checkout -B failed (do you have uncommitted changes preventing checkout?): {}".format(exc)
        ) from exc


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        description="Prepare AI prompt for a PR (detect student/task, run prepare_AI_prompt.py, optionally checkout PR)."
    )
    ap.add_argument("--pr", type=int, required=True, help="Pull request number")
    ap.add_argument("--repo", default=DEFAULT_REPO, help="Repository in owner/name format")
    ap.add_argument("--token", default=None, help="GitHub token (or use env GITHUB_TOKEN/GH_TOKEN)")
    ap.add_argument("--skip-checkout", action="store_true", help="Do not checkout the PR branch")
    ap.add_argument("--mark", action="store_true", help="Only add a comment and a label to the PR")
    ap.add_argument("--message", default=None, help="Comment body to post (used with --mark)")
    ap.add_argument("--label", default=None, help="Label to apply: 'rated' or 'defend' (used with --mark)")
    ap.add_argument("--prompt-file", default=None, help="Write the prepared prompt to this path")
    ap.add_argument(
        "--json-output",
        dest="metadata_json",
        default=None,
        help="Write detected metadata (student/task/prompt path) to this JSON file",
    )
    args = ap.parse_args(argv)

    eff_token = args.token or os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")

    if args.mark:
        if not args.message or not args.label:
            print("Error: --mark requires both --message and --label", file=sys.stderr)
            return 2
        if args.label.lower() not in ("rated", "defend"):
            print("Error: --label must be either 'rated' or 'defend'", file=sys.stderr)
            return 2
        if not eff_token:
            print("Error: --mark requires authentication via --token or GITHUB_TOKEN/GH_TOKEN", file=sys.stderr)
            return 2
        try:
            pr_obj = fetch_pr(args.repo, args.pr, eff_token)
            print(f"PR #{args.pr} -> {pr_obj.get('title', '(no title)')}")
        except Exception as exc:  # pragma: no cover
            print(f"Warning: could not fetch PR details: {exc}")
        print("Adding comment and label as requested by --mark ...")
        post_pr_comment(args.repo, args.pr, eff_token, args.message)
        add_pr_label(args.repo, args.pr, eff_token, args.label.lower())
        print(f"Added label '{args.label.lower()}' and posted a comment to PR #{args.pr}.")
        return 0

    pr_obj = fetch_pr(args.repo, args.pr, eff_token)
    print(f"PR #{args.pr} -> {pr_obj.get('title', '(no title)')}")

    pr_files = fetch_pr_files(args.repo, args.pr, eff_token)
    filenames = [item.get("filename", "") for item in pr_files]
    print("Changed files:")
    for item in pr_files:
        name = item.get("filename", "(unknown)")
        status = item.get("status", "?")
        print(f" - {status:>7} {name}")

    student, task = detect_student_task(filenames)
    print(f"Detected student='{student}' task='{task}'")

    prompt_text = run_prepare_script(student, task)
    print("\n=== Prepared prompt ===\n")
    print(prompt_text)
    print("\n=== End prompt ===\n")

    written_prompt: Path | None = None
    if args.prompt_file:
        prompt_path = Path(args.prompt_file)
        if not prompt_path.is_absolute():
            prompt_path = Path.cwd() / prompt_path
        prompt_path.parent.mkdir(parents=True, exist_ok=True)
        prompt_path.write_text(prompt_text, encoding="utf-8")
        written_prompt = prompt_path
        print(f"Saved prompt to {prompt_path}")

    if args.metadata_json:
        meta_path = Path(args.metadata_json)
        if not meta_path.is_absolute():
            meta_path = Path.cwd() / meta_path
        meta_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "pr": args.pr,
            "repo": args.repo,
            "student": student,
            "task": task,
            "prompt_file": str(written_prompt) if written_prompt else None,
        }
        meta_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Saved metadata to {meta_path}")

    if not args.skip_checkout:
        checkout_pr_branch(args.pr)
        print(f"Checked out local branch pr-{args.pr}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
