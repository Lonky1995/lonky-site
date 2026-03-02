#!/bin/bash
# 同步 crypto 简报到 lonky-site
# Usage: echo "简报内容" | bash sync-briefing.sh [morning|evening]
# 或者: bash sync-briefing.sh [morning|evening] "简报内容"

REPO="/Users/lonky/lonky-site"
JSON_FILE="$REPO/public/data/latest-briefing.json"
CONTENT_DIR="$REPO/content/crypto"
PERIOD="${1:-morning}"
TODAY=$(date +%Y-%m-%d)
NOW=$(date -u +%Y-%m-%dT%H:%M:%S)

# 读取简报内容：优先参数，否则 stdin
if [ -n "$2" ]; then
  BRIEFING="$2"
elif [ -f "/tmp/crypto_briefing.md" ]; then
  BRIEFING=$(cat /tmp/crypto_briefing.md)
else
  BRIEFING=$(cat)
fi

if [ -z "$BRIEFING" ]; then
  echo "Error: no briefing content" >&2
  exit 1
fi

# 1. 更新 latest-briefing.json
python3 -c "
import json, sys
content = sys.stdin.read()
data = {
    'date': '$TODAY',
    'period': '$PERIOD',
    'content': content,
    'generated_at': '${NOW}'
}
with open('$JSON_FILE', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print('JSON updated: $JSON_FILE')
" <<< "$BRIEFING"

# 2. 保存到 content/crypto/ 目录
mkdir -p "$CONTENT_DIR"
CONTENT_FILE="$CONTENT_DIR/$TODAY.md"
cat > "$CONTENT_FILE" << MDEOF
---
title: "BTC 日报 $TODAY"
date: $TODAY
type: crypto-brief
---

$BRIEFING
MDEOF
echo "Content saved: $CONTENT_FILE"

# 3. Git commit + push (with pull-rebase retry)
cd "$REPO" || exit 1
git add "$JSON_FILE" "$CONTENT_FILE"
if git diff --cached --quiet; then
  echo "No changes to commit"
else
  git commit -m "chore: update briefing $TODAY $(date +%H:%M)"

  # 最多重试 3 次：pull --rebase 后再 push
  for i in 1 2 3; do
    if git push 2>&1; then
      echo "Push success"
      exit 0
    fi
    echo "Push failed (attempt $i), pulling and retrying..."
    git pull --rebase 2>&1
  done

  echo "Push failed after 3 attempts" >&2
  exit 1
fi
