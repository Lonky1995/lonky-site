#!/usr/bin/env python3
"""
Sync latest tweet from @ImLonky to lonky-site GitHub repo.

Fetches the latest tweet ID via FxTwitter API (with syndication fallback),
compares with the current value in the repo, and pushes an update if changed.

Intended to run as a host_jobs cron task every 6 hours.
"""

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

# --- Config ---
TWITTER_USER = "ImLonky"
GITHUB_REPO = "Lonky1995/lonky-site"
GITHUB_BRANCH = "main"
FILE_PATH = "public/data/latest-tweet.json"

FXTWITTER_URL = f"https://api.fxtwitter.com/{TWITTER_USER}"
SYNDICATION_URL = (
    f"https://syndication.twitter.com/srv/timeline-profile/screen-name/{TWITTER_USER}"
)


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
    """Make a GitHub API request."""
    token = get_github_token()
    url = f"https://api.github.com/repos/{GITHUB_REPO}/{endpoint}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(
        url,
        data=body,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def fetch_tweet_id_fxtwitter() -> str | None:
    """Fetch latest tweet ID from FxTwitter API."""
    try:
        req = urllib.request.Request(
            FXTWITTER_URL,
            headers={"User-Agent": "lonky-site-sync/1.0"},
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())

        # FxTwitter returns user timeline; extract the latest tweet ID
        tweets = data.get("tweets") or []
        if tweets:
            return str(tweets[0].get("id", ""))

        # Some FxTwitter responses have a different structure
        tweet = data.get("tweet")
        if tweet:
            return str(tweet.get("id", ""))

        log("WARN: FxTwitter returned no tweets")
        return None
    except Exception as e:
        log(f"WARN: FxTwitter failed: {e}")
        return None


def fetch_tweet_id_syndication() -> str | None:
    """Fallback: scrape tweet ID from Twitter syndication timeline."""
    try:
        req = urllib.request.Request(
            SYNDICATION_URL,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
            },
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode()

        # Look for tweet IDs in the HTML (pattern: /status/DIGITS)
        import re

        ids = re.findall(r'/status/(\d{15,25})', html)
        if ids:
            # Return the largest (most recent) ID
            return str(max(ids, key=int))

        log("WARN: Syndication returned no tweet IDs")
        return None
    except Exception as e:
        log(f"WARN: Syndication failed: {e}")
        return None


def get_current_tweet_from_repo() -> tuple[str, str]:
    """
    Get the current tweet ID and file SHA from the GitHub repo.
    Returns (tweet_id, sha). Both may be empty if file doesn't exist.
    """
    try:
        data = github_api("GET", f"contents/{FILE_PATH}?ref={GITHUB_BRANCH}")
        sha = data.get("sha", "")
        import base64

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
    """Push updated latest-tweet.json to the GitHub repo."""
    import base64

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    payload = json.dumps(
        {"tweet_id": tweet_id, "updated_at": now},
        indent=2,
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


def main() -> None:
    log(f"Fetching latest tweet for @{TWITTER_USER}")

    # 1. Fetch latest tweet ID (FxTwitter first, then syndication fallback)
    tweet_id = fetch_tweet_id_fxtwitter()
    if not tweet_id:
        log("FxTwitter failed, trying syndication fallback...")
        tweet_id = fetch_tweet_id_syndication()

    if not tweet_id:
        log("ERROR: Could not fetch tweet ID from any source")
        sys.exit(1)

    log(f"Latest tweet ID: {tweet_id}")

    # 2. Compare with current value in repo
    current_id, sha = get_current_tweet_from_repo()
    if current_id == tweet_id:
        log("No update needed, tweet ID unchanged")
        sys.exit(0)

    log(f"Tweet ID changed: {current_id or '(none)'} -> {tweet_id}")

    # 3. Push update
    push_tweet_to_repo(tweet_id, sha)
    log("Done")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log(f"ERROR: {e}")
        sys.exit(1)
