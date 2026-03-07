#!/bin/bash
# 同步 crypto 简报到 lonky-site
# Usage: echo "简报内容" | bash sync-briefing.sh [morning|evening]
# 或者: bash sync-briefing.sh [morning|evening] "简报内容"
set -euo pipefail

REPO="/Users/lonky/lonky-site"
JSON_FILE="$REPO/public/data/latest-briefing.json"
CONTENT_DIR="$REPO/content/crypto"
PERIOD="${1:-morning}"
BRIEFING_ARG="${2:-}"
TODAY=$(date +%Y-%m-%d)
NOW=$(date -u +%Y-%m-%dT%H:%M:%S)
LOCK_DIR="/tmp/lonky-site-sync-briefing.lock"

case "$PERIOD" in
  morning|evening) ;;
  *)
    echo "Error: invalid period '$PERIOD' (use morning|evening)" >&2
    exit 1
    ;;
esac

# 避免并发执行导致写文件/提交流程互相踩踏
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "Error: another sync-briefing process is running" >&2
  exit 1
fi
cleanup() {
  rmdir "$LOCK_DIR" 2>/dev/null || true
}
trap cleanup EXIT

# 读取简报内容：优先参数，否则 stdin
if [ -n "$BRIEFING_ARG" ]; then
  BRIEFING="$BRIEFING_ARG"
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
  exit 0
else
  git commit -m "chore: update briefing $TODAY $(date +%H:%M)"

  # 最多重试 3 次：push 失败后 pull --rebase --autostash 再推送
  for i in 1 2 3; do
    if PUSH_OUTPUT=$(git push 2>&1); then
      [ -n "$PUSH_OUTPUT" ] && echo "$PUSH_OUTPUT"
      echo "Push success"
      exit 0
    fi
    [ -n "$PUSH_OUTPUT" ] && echo "$PUSH_OUTPUT" >&2
    echo "Push failed (attempt $i), pulling with --rebase --autostash and retrying..." >&2
    if ! PULL_OUTPUT=$(git pull --rebase --autostash 2>&1); then
      [ -n "$PULL_OUTPUT" ] && echo "$PULL_OUTPUT" >&2
      continue
    fi
    [ -n "$PULL_OUTPUT" ] && echo "$PULL_OUTPUT"
  done

  echo "Push failed after 3 attempts" >&2
  exit 1
fi
