#!/bin/sh
# Claude Code 플러그인·스킬 설치/업데이트 (Linux·macOS)
#   처음:   git clone https://github.com/KORThomasJeong/claude-setup.git ~/.claude-setup && sh ~/.claude-setup/install.sh
#   업데이트: sh ~/.claude-setup/install.sh        (레포를 pull 한 뒤 다시 설치·업데이트)
#   옵션:   --with-optional (telegram 등 선택 항목 포함), --dry-run
set -e
REPO_URL="${CLAUDE_SETUP_REPO:-https://github.com/KORThomasJeong/claude-setup.git}"

# 스크립트가 레포 안에 있으면 그 레포를 쓰고, 아니면(curl | sh) ~/.claude-setup 에 받는다
SELF_DIR=$(cd "$(dirname "$0")" 2>/dev/null && pwd || echo "")
if [ -n "$SELF_DIR" ] && [ -f "$SELF_DIR/setup.mjs" ]; then
	DIR="$SELF_DIR"
else
	DIR="${CLAUDE_SETUP_DIR:-$HOME/.claude-setup}"
fi

command -v git  >/dev/null 2>&1 || { echo "git이 필요합니다."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js(18 이상)가 필요합니다."; exit 1; }

if [ -d "$DIR/.git" ]; then
	echo "레포 갱신: $DIR"
	git -C "$DIR" pull --ff-only -q || echo "[경고] pull 실패. 현재 내용으로 진행합니다."
else
	echo "레포 받기: $REPO_URL → $DIR"
	git clone -q "$REPO_URL" "$DIR"
fi

exec node "$DIR/setup.mjs" install "$@"
