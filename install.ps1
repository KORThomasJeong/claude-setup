# Claude Code 플러그인·스킬 설치/업데이트 (Windows)
#   처음:    git clone https://github.com/KORThomasJeong/claude-setup.git $HOME\.claude-setup; & $HOME\.claude-setup\install.ps1
#   업데이트: & $HOME\.claude-setup\install.ps1        (레포를 pull 한 뒤 다시 설치·업데이트)
#   옵션:    -WithOptional (telegram 등 선택 항목 포함), -DryRun
param([switch]$WithOptional, [switch]$DryRun)
$ErrorActionPreference = 'Stop'
$RepoUrl = if ($env:CLAUDE_SETUP_REPO) { $env:CLAUDE_SETUP_REPO } else { 'https://github.com/KORThomasJeong/claude-setup.git' }

if ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot 'setup.mjs'))) {
    $Dir = $PSScriptRoot
} elseif ($env:CLAUDE_SETUP_DIR) {
    $Dir = $env:CLAUDE_SETUP_DIR
} else {
    $Dir = Join-Path $HOME '.claude-setup'
}

foreach ($bin in 'git', 'node') {
    if (-not (Get-Command $bin -ErrorAction SilentlyContinue)) { Write-Host "$bin 이(가) 필요합니다."; exit 1 }
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
}

$argsList = @((Join-Path $Dir 'setup.mjs'), 'install')
if ($WithOptional) { $argsList += '--with-optional' }
if ($DryRun) { $argsList += '--dry-run' }
& node @argsList
exit $LASTEXITCODE
