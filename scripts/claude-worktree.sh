#!/usr/bin/env bash
# Creates an isolated git worktree + local dev setup so a Claude Code session
# (or any parallel contributor) can work on a feature without touching this
# checkout's branch or colliding with another session's dev server port.
#
# Usage: scripts/claude-worktree.sh <feature-slug> [port] [api-port]
#   feature-slug   short kebab-case name, e.g. "staff-rendimiento"
#   port           optional; defaults to the next free port >= 3010
#   api-port       optional; which zenya-api port this frontend talks to
#                  (defaults to 8001, the canonical one — pass the matching
#                  zenya-api worktree's port if you spun one up too)
#
# The main checkout's own branch/working tree is never touched — this only
# ever runs `git fetch` and `git worktree add` against it.

set -euo pipefail

SLUG="${1:?Usage: scripts/claude-worktree.sh <feature-slug> [port] [api-port]}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_NAME="$(basename "$REPO_DIR")"
WORKTREE_DIR="$REPO_DIR/../${REPO_NAME}-${SLUG}"
BRANCH="feat/${SLUG}"
PORT_FLOOR=3010

if [ -e "$WORKTREE_DIR" ]; then
  echo "error: $WORKTREE_DIR already exists" >&2
  exit 1
fi

echo "Fetching origin..."
git -C "$REPO_DIR" fetch origin

echo "Creating worktree at $WORKTREE_DIR on branch $BRANCH (off origin/stage)..."
git -C "$REPO_DIR" worktree add "$WORKTREE_DIR" -b "$BRANCH" origin/stage

echo "Symlinking node_modules..."
ln -s "$REPO_DIR/node_modules" "$WORKTREE_DIR/node_modules"

PORT="${2:-}"
if [ -z "$PORT" ]; then
  PORT=$PORT_FLOOR
  while lsof -i ":$PORT" >/dev/null 2>&1; do
    PORT=$((PORT + 1))
  done
fi

API_PORT="${3:-8001}"

cat > "$WORKTREE_DIR/.env.development" <<EOF
REACT_APP_API_URL=http://localhost:${API_PORT}
REACT_APP_API_KEY=dev-key
EOF

cat <<EOF

Worktree ready: $WORKTREE_DIR
Branch:         $BRANCH
Port:           $PORT
API target:     http://localhost:${API_PORT}

Start the server with:
  cd "$WORKTREE_DIR"
  PORT=$PORT BROWSER=none npx react-scripts start

When done:
  cd "$REPO_DIR"
  git worktree remove "../${REPO_NAME}-${SLUG}"
EOF
