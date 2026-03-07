#!/bin/bash
# Auto-push content changes from Obsidian to GitHub
# Runs via cron

REPO="/Users/lonky/lonky-site"
LOG="/tmp/lonky-site-autopush.log"
WATCH_PATHS=("content/" "public/data/latest-briefing.json")

cd "$REPO" || exit 1

# Watch content and briefing index json
CHANGES=$(git diff --name-only -- "${WATCH_PATHS[@]}" 2>/dev/null)
UNTRACKED=$(git ls-files --others --exclude-standard -- "${WATCH_PATHS[@]}" 2>/dev/null)

if [ -z "$CHANGES" ] && [ -z "$UNTRACKED" ]; then
  exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Changes detected:" >> "$LOG"
echo "$CHANGES $UNTRACKED" >> "$LOG"

# Pull first to avoid conflicts
git pull --rebase --autostash --quiet 2>> "$LOG"

# Stage watched paths only
git add -- "${WATCH_PATHS[@]}" 2>> "$LOG"
if git diff --cached --quiet; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] No staged changes after add" >> "$LOG"
  exit 0
fi

# Commit with auto message
git commit -m "Auto-sync: update content and briefing" --quiet 2>> "$LOG"

# Push
if git push --quiet 2>> "$LOG"; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Push success" >> "$LOG"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Push failed" >> "$LOG"
fi
