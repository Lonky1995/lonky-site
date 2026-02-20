#!/usr/bin/env python3
"""
Sync latest WeChat article to lonky.me
Uses browser automation to fetch article content from mp.weixin.qq.com
"""

import json
import os
import sys
import subprocess
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Configuration
WECHAT_ARTICLE_URL = "https://mp.weixin.qq.com/s/TpwYuqq1kWA7hrr549gpJg"  # Default article, can be updated
DATA_FILE = Path(__file__).parent.parent / "public" / "data" / "latest-wechat.json"
GITHUB_REPO = "lonky-site"

def log(msg: str):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"[{ts}] {msg}", file=sys.stderr)

def fetch_article_via_openclaw(url: str) -> dict:
    """Use OpenClaw browser tool to fetch WeChat article"""
    # This will be called by OpenClaw agent, so we output instructions
    return {
        "needs_browser": True,
        "url": url,
        "instructions": "Use browser tool to open URL, take snapshot, extract title and content"
    }

def read_current_data() -> dict:
    """Read current data file"""
    if DATA_FILE.exists():
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {}

def save_data(data: dict):
    """Save data to file"""
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    log(f"Saved to {DATA_FILE}")

def push_to_github():
    """Push changes to GitHub"""
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        log("ERROR: GITHUB_TOKEN not set")
        return False
    
    repo_dir = Path(__file__).parent.parent
    os.chdir(repo_dir)
    
    try:
        # Add and commit
        subprocess.run(["git", "add", str(DATA_FILE)], check=True)
        result = subprocess.run(
            ["git", "diff", "--cached", "--quiet"],
            capture_output=True
        )
        if result.returncode == 0:
            log("No changes to commit")
            return True
        
        subprocess.run(
            ["git", "commit", "-m", f"chore: update latest wechat article"],
            check=True
        )
        subprocess.run(["git", "push"], check=True)
        log("Pushed to GitHub")
        return True
    except subprocess.CalledProcessError as e:
        log(f"Git error: {e}")
        return False

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Sync WeChat article to lonky.me")
    parser.add_argument("--url", help="Article URL to sync")
    parser.add_argument("--title", help="Article title")
    parser.add_argument("--content", help="Article content/summary")
    parser.add_argument("--author", default="火星拾荒者", help="Author name")
    parser.add_argument("--push", action="store_true", help="Push to GitHub")
    args = parser.parse_args()
    
    if not args.title or not args.content:
        log("Usage: sync-wechat.py --title 'Title' --content 'Content' [--url URL] [--push]")
        log("This script is designed to be called by OpenClaw agent after fetching article via browser")
        sys.exit(1)
    
    # Create data
    data = {
        "title": args.title,
        "content": args.content[:500],  # Truncate for preview
        "author": args.author,
        "url": args.url or WECHAT_ARTICLE_URL,
        "updated_at": datetime.now(timezone(timedelta(hours=8))).strftime("%Y-%m-%d %H:%M"),
        "synced_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Check if different from current
    current = read_current_data()
    if current.get("title") == data["title"] and current.get("content") == data["content"]:
        log("No update needed, content unchanged")
        return
    
    # Save
    save_data(data)
    
    # Push if requested
    if args.push:
        push_to_github()
        log("Pushed to GitHub")
    else:
        log("Saved locally. Use --push to push to GitHub")

if __name__ == "__main__":
    main()
