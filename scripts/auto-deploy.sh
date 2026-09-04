#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/ubuntu/marathon-platform"
BRANCH="main"
REPO_API="https://api.github.com/repos/bazoftrope/mart"
LOG_FILE="/home/ubuntu/marathon-auto-deploy.log"
LOCK_FILE="/tmp/marathon-auto-deploy.lock"

log() {
  echo "$(date -Is) $*" >> "$LOG_FILE"
}

# Prevent overlapping deploys (cron runs every minute, build may take several minutes).
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "deploy already running, skip"
  exit 0
fi

cd "$REPO_DIR"

git fetch origin "$BRANCH" >> "$LOG_FILE" 2>&1

LOCAL_SHA=$(git rev-parse HEAD)
REMOTE_SHA=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL_SHA" = "$REMOTE_SHA" ]; then
  exit 0
fi

log "new commit detected: $LOCAL_SHA -> $REMOTE_SHA"

# Deploy only after GitHub Actions CI job has passed.
CI_STATE=$(curl -fsS "$REPO_API/commits/$REMOTE_SHA/check-runs" | python3 -c '
import json, sys

data = json.load(sys.stdin)
name = "Lint and build"
conclusions = [
    run.get("conclusion")
    for run in data.get("check_runs", [])
    if run.get("name") == name and run.get("status") == "completed"
]
print(conclusions[-1] if conclusions else "pending")
')

if [ "$CI_STATE" != "success" ]; then
  log "CI state is '$CI_STATE', deploy postponed"
  exit 0
fi

log "CI passed, deploying $REMOTE_SHA"

git checkout -f "$BRANCH" 2>/dev/null || git checkout -f -B "$BRANCH" "origin/$BRANCH"
git reset --hard "origin/$BRANCH"

log "docker compose build..."
docker compose build >> "$LOG_FILE" 2>&1

log "docker compose up -d..."
docker compose up -d >> "$LOG_FILE" 2>&1

log "deploy finished"
