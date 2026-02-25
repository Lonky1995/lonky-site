#!/bin/bash
# Auto-push content changes from Obsidian to GitHub
# Runs via cron every 10 minutes

REPO="/Users/lonky/lonky-site"
LOG="/tmp/lonky-site-autopush.log"

cd "$REPO" || exit 1

# Only watch content/ directory (blog articles, podcast notes)
CHANGES=$(git diff --name-only content/ 2>/dev/null)
UNTRACKED=$(git ls-files --others --exclude-standard content/ 2>/dev/null)

if [ -z "$CHANGES" ] && [ -z "$UNTRACKED" ]; then
  exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Changes detected:" >> "$LOG"
echo "$CHANGES $UNTRACKED" >> "$LOG"

# Pull first to avoid conflicts
git pull --rebase --quiet 2>> "$LOG"

# Stage only content/ changes
git add content/ 2>> "$LOG"

# Commit with auto message
git commit -m "Auto-sync: update content from Obsidian" --quiet 2>> "$LOG"

# Push
if git push --quiet 2>> "$LOG"; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Push success" >> "$LOG"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Push failed" >> "$LOG"
fi
