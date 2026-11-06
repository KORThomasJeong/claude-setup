# claude-setup

Claude Code 플러그인과 스킬을 여러 PC·서버에서 똑같이 맞추는 레포입니다.
목록은 `manifest.json` 한 곳에 있고, 직접 만든 스킬(또는 원본 레포에서 사라진 스킬)은 `skills/`에 원본째 들어 있습니다.

## 새 PC에 설치

Windows (PowerShell)
```powershell
git clone https://github.com/KORThomasJeong/claude-setup.git $HOME\.claude-setup
& $HOME\.claude-setup\install.ps1
```

Linux / macOS
```sh
git clone https://github.com/KORThomasJeong/claude-setup.git ~/.claude-setup
sh ~/.claude-setup/install.sh
```

필요한 것: `claude`, `git`, `node`(18 이상). 비공개 레포라서 clone할 때 GitHub 로그인이 필요합니다.
설치가 끝나면 Claude Code를 다시 시작하세요.

선택 항목(telegram 등)까지 설치하려면 `install.ps1 -WithOptional` / `install.sh --with-optional`을 쓰면 됩니다.
실제로 바꾸지 않고 할 일만 보려면 `-DryRun` / `--dry-run`을 쓰세요.

## 업데이트 (이미 설치한 PC)

설치 명령을 다시 실행하면 됩니다. 순서는 이렇습니다.

1. 이 레포를 `git pull`
2. 마켓플레이스 갱신 → 플러그인 `update`, 새로 들어온 플러그인은 `install`
3. `npx skills add`로 스킬 패키지를 최신으로 다시 받기
4. `skills/`의 스킬을 `~/.claude/skills`에 복사. 내용이 다르면 기존 것을 `~/.claude/skills-backup/<시각>/`에 백업하고 교체

```powershell
& $HOME\.claude-setup\install.ps1      # Windows
```
```sh
sh ~/.claude-setup/install.sh          # Linux / macOS
```

## 새 플러그인·스킬을 추가해서 다른 PC에도 퍼뜨리기

어느 PC에서든 평소처럼 설치한 뒤 `export`로 레포에 올리면 됩니다.

```sh
# 1) 평소처럼 설치
claude plugin marketplace add owner/repo
claude plugin install 이름@마켓플레이스
npx skills add owner/skills -g -s 스킬이름
# 또는 ~/.claude/skills/새스킬/SKILL.md 를 직접 만들기

# 2) 레포에 반영 (무엇이 추가되는지 먼저 보기)
cd ~/.claude-setup
node setup.mjs status
node setup.mjs export --push      # manifest.json·skills/ 갱신 → 커밋 → 푸시

# 3) 다른 PC에서는 설치 명령을 다시 실행
```

`export`가 분류하는 방식은 이렇습니다.

| 이 PC에 있는 것 | 레포에 들어가는 곳 |
|---|---|
| `claude plugin marketplace add` 로 추가한 GitHub/git 마켓플레이스 | `manifest.json` → `marketplaces` |
| user 범위로 설치한 플러그인 | `manifest.json` → `plugins` |
| `npx skills add` 로 설치한 스킬 (`~/.agents/.skill-lock.json`) | `manifest.json` → `skillPackages` |
| 패키지 스킬을 손으로 복사해 둔 폴더 (원본 레포에 같은 이름이 있음) | `skillPackages` 에 이름만 추가 |
| 원본 레포에서 사라진 스킬, 직접 만든 스킬 | `skills/<이름>/` 에 원본 복사 |

**추가만 합니다.** 어떤 PC에서 지운 것이 manifest에서 빠지지는 않습니다. 빼려면 `manifest.json`이나 `skills/`를 직접 고치세요.

### 직접 만든 스킬을 고쳤을 때

`skills/`에 이미 있는 스킬은 export해도 덮어쓰지 않습니다. PC마다 버전이 달라서, 그냥 두면 마지막에 export한 쪽이 이기기 때문입니다.
고친 PC에서 아래처럼 명시해서 올리세요.

```sh
node setup.mjs export --overwrite 스킬이름 --push
```

또는 레포의 `skills/스킬이름/`을 직접 고쳐서 커밋해도 됩니다.

### 손으로 추가하기

`manifest.json`을 직접 고쳐도 됩니다.

```jsonc
{
  "marketplaces": [{ "name": "마켓플레이스 이름", "repo": "owner/repo" }],
  "plugins":      [{ "id": "플러그인@마켓플레이스" }, { "id": "...", "optional": true, "note": "왜 선택인지" }],
  "skillPackages":[{ "source": "owner/repo", "skills": ["이름", "..."] }],   // "skills": "*" 이면 전부
  "ignorePlugins":["export 때 무시할 플러그인"],
  "ignoreSkills": ["export 때 무시할 스킬"]
}
```

## 현재 들어 있는 것 (2026-11-06 기준)

- 플러그인: superpowers, frontend-design, context7, claude-hud, hwpx-plugin, security-audit, ph(planning-helper-kit), loop-runner, research-prompter, telegram(선택)
- 스킬 패키지: mattpocock/skills 31개, vercel-labs/skills(find-skills), awslabs/agent-plugins(aws-architecture-diagram)
- `skills/`: research-sources, reverse-engineer-anything, lookbook, g-c-design-system, styleseed 계열(ss-*, styleseed-design-review), 원본에서 사라진 mattpocock 옛 스킬(caveman, diagnose, to-prd 등)

일부러 뺀 것
- `mattpocock-skills@claude-plugins-official` 플러그인: `npx skills`로 받는 mattpocock 스킬과 겹침
- `릴리즈` 스킬: oracle1의 `/home/ubuntu/Osync` 전용이라 그 프로젝트의 `.claude/skills`에 두는 것이 맞음
- claude.ai 계정 스킬(`~/.claude/skills/synced`): 같은 계정으로 로그인하면 자동으로 들어옴
- `settings.json`, 텔레그램 토큰, MCP 서버 설정: PC마다 다르거나 비밀값이 있어 올리지 않음

## 주의

- `reverse-engineer-anything` 스킬은 `rea` MCP 서버(`npx -y rea-agents@6.7.0 mcp`)가 있어야 쓸 수 있습니다. MCP는 이 레포가 설치하지 않습니다.
- `research-sources`는 `KCI_API_KEY`, `SCIENCEON_TOKEN` 같은 키를 환경변수로 읽습니다. 키는 레포에 넣지 마세요.
- Windows에서 일부 마켓플레이스는 경로가 길어서, `install.ps1`이 `git config --global core.longpaths true`를 켭니다.
