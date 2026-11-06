#!/bin/sh
# Claude Code 플러그인·스킬 설치/업데이트 (Linux·macOS)
#   한 줄 설치:  curl -fsSL https://raw.githubusercontent.com/KORThomasJeong/claude-setup/main/install.sh | sh
#   업데이트:    sh ~/.claude-setup/install.sh        (레포를 pull 한 뒤 다시 설치·업데이트)
#   옵션:        --with-optional (telegram 등 선택 항목 포함), --dry-run
#                한 줄 설치에 옵션을 줄 때:  curl -fsSL ... | sh -s -- --dry-run
#   환경변수:    CLAUDE_SETUP_REPO (레포 주소), CLAUDE_SETUP_DIR (받을 위치, 기본 ~/.claude-setup)
set -e
REPO_URL="${CLAUDE_SETUP_REPO:-https://github.com/KORThomasJeong/claude-setup.git}"

# 파일로 실행했고 옆에 setup.mjs가 있으면 그 레포를 쓴다. curl | sh 로 실행하면 $0이 sh라서 해당 없음
DIR="${CLAUDE_SETUP_DIR:-$HOME/.claude-setup}"
case "$0" in
	*install.sh)
		SELF_DIR=$(cd "$(dirname "$0")" && pwd)
		[ -f "$SELF_DIR/setup.mjs" ] && DIR="$SELF_DIR"
		;;
esac

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
