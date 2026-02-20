#!/usr/bin/env python3
"""
Sync latest tweet from @ImLonky to lonky-site GitHub repo.

Usage modes:
  1. Telegram command: called by OpenClaw bot with tweet URL as argument
     python3 sync-tweet.py https://x.com/ImLonky/status/1234567890
  2. Cron fallback: tries RSSHub instances (best-effort, may fail)

Intended as a host_jobs task + manual trigger from Telegram bot.
"""

import base64
import json
import os
import re
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

# --- Config ---
TWITTER_USER = "ImLonky"
GITHUB_REPO = "Lonky1995/lonky-site"
GITHUB_BRANCH = "main"
FILE_PATH = "public/data/latest-tweet.json"

RSSHUB_INSTANCES = [
    "https://rsshub.app",
    "https://rsshub.rssforever.com",
]

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"


def log(msg: str) -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"[{ts}] {msg}")


def get_github_token() -> str:
    token = os.environ.get("GITHUB_TOKEN", "")
    if not token:
        log("ERROR: GITHUB_TOKEN env var not set")
        sys.exit(1)
    return token


def github_api(method: str, endpoint: str, data: dict | None = None) -> dict:
    token = get_github_token()
    url = f"https://api.github.com/repos/{GITHUB_REPO}/{endpoint}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(
        url, data=body, method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


# ---------- Tweet ID extraction ----------

def extract_tweet_id_from_url(url: str) -> str | None:
    """Extract tweet/status ID from any X/Twitter URL."""
    m = re.search(r'/status/(\d+)', url)
    return m.group(1) if m else None


def fetch_from_rsshub() -> str | None:
    """Best-effort: parse latest tweet ID from RSSHub (public instances unreliable)."""
    for base in RSSHUB_INSTANCES:
        url = f"{base}/twitter/user/{TWITTER_USER}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=15) as resp:
                xml = resp.read().decode()
            ids = re.findall(r'/status/(\d{15,25})', xml)
            if ids:
                newest = str(max(ids, key=int))
                log(f"RSSHub ({base}): found tweet {newest}")
                return newest
            log(f"WARN: RSSHub ({base}) returned no tweet IDs")
        except Exception as e:
            log(f"WARN: RSSHub ({base}) failed: {e}")
    return None


# ---------- GitHub helpers ----------

def get_current_tweet_from_repo() -> tuple[str, str]:
    try:
        data = github_api("GET", f"contents/{FILE_PATH}?ref={GITHUB_BRANCH}")
        sha = data.get("sha", "")
        content = base64.b64decode(data.get("content", "")).decode()
        existing = json.loads(content)
        return existing.get("tweet_id", ""), sha
    except urllib.error.HTTPError as e:
        if e.code == 404:
            log("File not found in repo, will create")
            return "", ""
        raise
    except Exception as e:
        log(f"WARN: Could not read current file from repo: {e}")
        return "", ""


def push_tweet_to_repo(tweet_id: str, sha: str) -> None:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    payload = json.dumps(
        {"tweet_id": tweet_id, "updated_at": now}, indent=2,
    ) + "\n"

    data: dict = {
        "message": f"chore: update latest tweet to {tweet_id}",
        "content": base64.b64encode(payload.encode()).decode(),
        "branch": GITHUB_BRANCH,
    }
    if sha:
        data["sha"] = sha

    github_api("PUT", f"contents/{FILE_PATH}", data)
    log(f"Pushed tweet_id={tweet_id} to {GITHUB_REPO}")


# ---------- Main ----------

def main() -> None:
    tweet_id = None

    # Mode 1: URL passed as argument (from Telegram bot command)
    if len(sys.argv) > 1:
        url_arg = sys.argv[1]
        tweet_id = extract_tweet_id_from_url(url_arg)
        if tweet_id:
            log(f"Extracted tweet ID from URL: {tweet_id}")
        else:
            # Maybe it's a raw tweet ID
            if re.match(r'^\d{15,25}$', url_arg):
                tweet_id = url_arg
                log(f"Using raw tweet ID: {tweet_id}")
            else:
                log(f"ERROR: Could not extract tweet ID from: {url_arg}")
                sys.exit(1)
    else:
        # Mode 2: Cron auto-fetch (best-effort)
        log(f"Fetching latest tweet for @{TWITTER_USER}")
        tweet_id = fetch_from_rsshub()
        if not tweet_id:
            log("WARN: Auto-fetch failed (all sources down). No update.")
            sys.exit(0)  # Exit 0 — not an error, just no data

    log(f"Latest tweet ID: {tweet_id}")

    current_id, sha = get_current_tweet_from_repo()

    # Only update if new ID is different and larger (newer)
    if current_id == tweet_id:
        log("No update needed, tweet ID unchanged")
        sys.exit(0)

    if current_id and int(tweet_id) < int(current_id):
        log(f"WARN: Fetched ID ({tweet_id}) is older than current ({current_id}), skipping")
        sys.exit(0)

    log(f"Tweet ID changed: {current_id or '(none)'} -> {tweet_id}")
    push_tweet_to_repo(tweet_id, sha)
    log("Done")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log(f"ERROR: {e}")
        sys.exit(1)
