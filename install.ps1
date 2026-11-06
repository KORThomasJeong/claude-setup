# Claude Code 플러그인·스킬 설치/업데이트 (Windows)
#   한 줄 설치:  irm https://raw.githubusercontent.com/KORThomasJeong/claude-setup/main/install.ps1 | iex
#   업데이트:    & $HOME\.claude-setup\install.ps1      (레포를 pull 한 뒤 다시 설치·업데이트)
#   옵션:        -WithOptional (telegram 등 선택 항목 포함), -DryRun
#   환경변수:    CLAUDE_SETUP_REPO (레포 주소), CLAUDE_SETUP_DIR (받을 위치, 기본 ~/.claude-setup)
param([switch]$WithOptional, [switch]$DryRun)

# irm | iex 로 실행될 때 사용자 세션을 건드리지 않도록(창 닫힘·설정 변경 방지) 블록 안에서 실행한다
$__root = $PSScriptRoot
& {
    param($Root, $WithOptional, $DryRun)
    $ErrorActionPreference = 'Stop'
    $RepoUrl = if ($env:CLAUDE_SETUP_REPO) { $env:CLAUDE_SETUP_REPO } else { 'https://github.com/KORThomasJeong/claude-setup.git' }

    if ($Root -and (Test-Path (Join-Path $Root 'setup.mjs'))) {
        $Dir = $Root
    } elseif ($env:CLAUDE_SETUP_DIR) {
        $Dir = $env:CLAUDE_SETUP_DIR
    } else {
        $Dir = Join-Path $HOME '.claude-setup'
    }

    foreach ($bin in 'git', 'node') {
        if (-not (Get-Command $bin -ErrorAction SilentlyContinue)) { Write-Host "$bin 이(가) 필요합니다."; return }
    }

    # 일부 마켓플레이스(hwpx 등)는 경로가 길어 Windows 260자 제한에 걸린다
    git config --global core.longpaths true

    if (Test-Path (Join-Path $Dir '.git')) {
        Write-Host "레포 갱신: $Dir"
        git -C $Dir pull --ff-only -q
        if ($LASTEXITCODE -ne 0) { Write-Host '[경고] pull 실패. 현재 내용으로 진행합니다.' }
    } else {
        Write-Host "레포 받기: $RepoUrl -> $Dir"
        git clone -q $RepoUrl $Dir
        if ($LASTEXITCODE -ne 0) { Write-Host 'clone 실패'; return }
    }

    $argsList = @((Join-Path $Dir 'setup.mjs'), 'install')
    if ($WithOptional) { $argsList += '--with-optional' }
    if ($DryRun) { $argsList += '--dry-run' }
    & node @argsList
} $__root $WithOptional $DryRun
