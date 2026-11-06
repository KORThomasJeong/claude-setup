# claude-setup

Claude Code 플러그인과 스킬을 여러 PC·서버에 한 번에 설치하고, 계속 맞춰 두는 레포입니다.

- 설치할 목록은 `manifest.json` 한 파일에 있습니다 (마켓플레이스, 플러그인, `npx skills` 스킬 패키지).
- 직접 만든 스킬과 원본 레포에서 사라진 스킬은 `skills/`에 원본째 들어 있습니다.
- 설치 명령을 다시 실행하면 그게 곧 업데이트입니다.
- 어느 PC에서 새로 설치한 것은 `export` 한 번으로 레포에 올리고, 다른 PC에서 다시 설치하면 따라옵니다.

제 개인 구성이지만 공개해 두었으니 그대로 쓰거나, 포크해서 `manifest.json`만 바꿔 써도 됩니다. ([포크해서 쓰기](#포크해서-쓰기))

## 빠른 설치

필요한 것: [Claude Code](https://claude.com/claude-code), `git`, `node`(18 이상)

**Windows (PowerShell)**
```powershell
irm https://raw.githubusercontent.com/KORThomasJeong/claude-setup/main/install.ps1 | iex
```

**Linux / macOS**
```sh
curl -fsSL https://raw.githubusercontent.com/KORThomasJeong/claude-setup/main/install.sh | sh
```

레포가 `~/.claude-setup`에 받아지고 설치가 진행됩니다. 끝나면 Claude Code를 다시 시작하세요.

clone해서 직접 실행해도 같습니다.
```sh
git clone https://github.com/KORThomasJeong/claude-setup.git ~/.claude-setup
sh ~/.claude-setup/install.sh                 # Windows: & $HOME\.claude-setup\install.ps1
```

| 옵션 | Windows | Linux / macOS |
|---|---|---|
| 선택 항목(telegram 등)까지 설치 | `-WithOptional` | `--with-optional` |
| 바꾸지 않고 할 일만 보기 | `-DryRun` | `--dry-run` |

## 업데이트

설치 명령을 다시 실행하면 됩니다.

```powershell
& $HOME\.claude-setup\install.ps1      # Windows
```
```sh
sh ~/.claude-setup/install.sh          # Linux / macOS
```

하는 일은 순서대로 이렇습니다.

1. 이 레포를 `git pull`
2. 마켓플레이스 갱신 → 설치된 플러그인은 `update`, 새로 들어온 플러그인은 `install`
3. `npx skills add`로 스킬 패키지를 최신으로 다시 받기
4. `skills/`를 `~/.claude/skills`에 복사. 내용이 다르면 기존 것을 `~/.claude/skills-backup/<시각>/`에 백업하고 교체

manifest에서 빠진 항목을 PC에서 지우지는 않습니다.

## 새 플러그인·스킬을 추가해서 다른 PC에도 퍼뜨리기

어느 PC에서든 평소처럼 설치한 뒤 `export`로 레포에 올리면 됩니다.

```sh
# 1) 평소처럼 설치
claude plugin marketplace add owner/repo
claude plugin install 이름@마켓플레이스
npx skills add owner/skills -g -s 스킬이름
# 또는 ~/.claude/skills/새스킬/SKILL.md 를 직접 만들기

# 2) 레포에 반영
cd ~/.claude-setup
node setup.mjs status              # 이 PC에만 있는 것 미리 보기
node setup.mjs export --push       # manifest.json·skills/ 갱신 → 커밋 → 푸시

# 3) 다른 PC에서는 설치 명령을 다시 실행
```

`export`는 이 PC의 상태를 이렇게 나눠 담습니다.

| 이 PC에 있는 것 | 레포에 들어가는 곳 |
|---|---|
| GitHub/git 마켓플레이스 | `manifest.json` → `marketplaces` |
| user 범위로 설치한 플러그인 | `manifest.json` → `plugins` |
| `npx skills add`로 설치한 스킬 (`~/.agents/.skill-lock.json`) | `manifest.json` → `skillPackages` |
| 패키지 스킬을 손으로 복사해 둔 폴더 (원본 레포에 같은 이름이 있음) | `skillPackages`에 이름만 추가 |
| 원본 레포에서 사라진 스킬, 직접 만든 스킬 | `skills/<이름>/`에 원본 복사 |

- **추가만 합니다.** 어떤 PC에서 지운 것이 manifest에서 빠지지 않습니다. 빼려면 `manifest.json`이나 `skills/`를 직접 고치고, 다시 들어오지 않게 `ignorePlugins`/`ignoreSkills`에 넣으세요.
- **공개 레포라서 비밀값을 검사합니다.** GitHub·Anthropic·OpenAI·AWS·Slack·텔레그램 토큰이나 개인키 형식의 문자열이 있으면 커밋·푸시를 멈춥니다. 그래도 스킬 안에 내부 주소나 개인 정보가 없는지는 직접 확인하세요.

### 직접 만든 스킬을 고쳤을 때

`skills/`에 이미 있는 스킬은 export해도 덮어쓰지 않습니다. PC마다 버전이 다를 수 있어서, 그냥 두면 마지막에 export한 쪽이 이기기 때문입니다. 고친 PC에서 명시해서 올리세요.

```sh
node setup.mjs export --overwrite 스킬이름 --push     # 여러 개 가능, 전부는 --overwrite-all
```

레포의 `skills/스킬이름/`을 직접 고쳐서 커밋해도 됩니다.

## manifest.json 형식

```jsonc
{
  "marketplaces": [{ "name": "마켓플레이스 이름", "repo": "owner/repo" }],   // git 주소는 "url"
  "plugins": [
    { "id": "플러그인@마켓플레이스" },
    { "id": "...", "optional": true, "note": "기본 설치에서 빠지는 이유" }
  ],
  "skillPackages": [{ "source": "owner/repo", "skills": ["이름", "..."] }],   // "skills": "*" 이면 전부
  "ignorePlugins": ["export 때 무시할 플러그인"],
  "ignoreSkills": ["export 때 무시할 스킬"]
}
```

## 포크해서 쓰기

1. 이 레포를 포크하거나 새 레포로 복사합니다.
2. `manifest.json`과 `skills/`를 내 구성으로 바꿉니다. 이미 쓰고 있는 PC가 있다면 `manifest.json`을 비운 뒤 그 PC에서 `node setup.mjs export`를 실행하면 채워집니다.
3. 설치할 때 레포 주소를 바꿔 줍니다. `install.ps1`·`install.sh`의 `REPO_URL` 기본값을 고치거나, 환경변수로 넘기면 됩니다.

```sh
CLAUDE_SETUP_REPO=https://github.com/나/claude-setup.git sh install.sh
```

받는 위치는 `CLAUDE_SETUP_DIR`로 바꿀 수 있습니다 (기본 `~/.claude-setup`).

## 지금 들어 있는 것

**플러그인**

| 플러그인 | 마켓플레이스 |
|---|---|
| superpowers, frontend-design | [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) |
| claude-hud | [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud) |
| hwpx-plugin | [airmang/hwpx-skill](https://github.com/airmang/hwpx-skill) |
| security-audit | [KORThomasJeong/claude-security-audit](https://github.com/KORThomasJeong/claude-security-audit) |
| ph | [KORThomasJeong/planning-helper-kit](https://github.com/KORThomasJeong/planning-helper-kit) |
| research-prompter | [KORThomasJeong/claude-research-prompter](https://github.com/KORThomasJeong/claude-research-prompter) |
| telegram (선택) | anthropics/claude-plugins-official (봇 토큰을 PC마다 따로 설정) |

**스킬 패키지** (`npx skills`로 설치)
- [mattpocock/skills](https://github.com/mattpocock/skills) 31개
- [vercel-labs/skills](https://github.com/vercel-labs/skills): find-skills
- [awslabs/agent-plugins](https://github.com/awslabs/agent-plugins): aws-architecture-diagram

**`skills/`에 든 것**
- 직접 만든 스킬: research-sources(국내외 논문·건설 자료 API 수집), lookbook(design-lookbook 프리셋 적용), g-c-design-system
- 원본에서 사라졌거나 이름이 바뀐 스킬의 사본: mattpocock 옛 스킬(caveman, diagnose, to-prd 등), styleseed(ss-*, styleseed-design-review), reverse-engineer-anything

**일부러 뺀 것**
- `mattpocock-skills` 플러그인: `npx skills`로 받는 mattpocock 스킬과 겹침
- `context7`, `loop-runner` 플러그인: 쓰지 않아 제외
- 특정 프로젝트 전용 스킬: 그 프로젝트의 `.claude/skills`에 두는 것이 맞음
- claude.ai 계정 스킬(`~/.claude/skills/synced`): 같은 계정으로 로그인하면 자동으로 들어옴
- `settings.json`, 토큰, MCP 서버 설정: PC마다 다르거나 비밀값이 있음

## 주의

- `reverse-engineer-anything`은 `rea` MCP 서버(`npx -y rea-agents@6.7.0 mcp`)가 있어야 동작합니다. MCP 서버는 이 레포가 설치하지 않습니다.
- `research-sources`는 `KCI_API_KEY`, `SCIENCEON_TOKEN` 같은 키를 환경변수에서 읽습니다.
- Windows에서는 일부 마켓플레이스의 경로가 260자를 넘어서, `install.ps1`이 `git config --global core.longpaths true`를 켭니다.
- 스킬은 에이전트 권한으로 실행됩니다. 남의 구성을 설치하기 전에 내용을 한 번 훑어보세요.

## 라이선스

이 레포의 스크립트와 직접 만든 스킬은 [MIT](LICENSE)입니다. 다른 프로젝트에서 가져온 스킬의 출처와 저작권은 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)에 있습니다.
