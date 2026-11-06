#!/usr/bin/env node
// Claude Code 플러그인·스킬 동기화 스크립트
//
//   node setup.mjs install [--with-optional] [--dry-run]   manifest.json 기준으로 설치·업데이트
//   node setup.mjs export  [--push] [--dry-run]            현재 PC 상태를 manifest.json / skills/ 에 반영
//                          [--overwrite 이름... | --overwrite-all]  레포에 이미 있는 스킬을 이 PC 버전으로 교체
//   node setup.mjs status                                   manifest와 현재 PC 차이만 보기
//
// 원칙: 추가만 한다. manifest에서 빠진 항목을 PC에서 지우거나, PC에 없는 항목을 manifest에서 지우지 않는다.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = path.join(REPO, 'manifest.json');
const REPO_SKILLS = path.join(REPO, 'skills');
const HOME = os.homedir();
const CLAUDE_DIR = process.env.CLAUDE_CONFIG_DIR || path.join(HOME, '.claude');
const USER_SKILLS = path.join(CLAUDE_DIR, 'skills');
const AGENTS_LOCK = path.join(HOME, '.agents', '.skill-lock.json');
const IS_WIN = process.platform === 'win32';

const argv = process.argv.slice(2);
const cmd = argv[0];
const flag = (f) => argv.includes(f);
const DRY = flag('--dry-run');

const log = (...a) => console.log(...a);
const warn = (...a) => console.log('  [경고]', ...a);

function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}
function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}
function run(bin, args, { quiet = false, allowFail = true } = {}) {
  if (DRY) { log(`  (dry-run) ${bin} ${args.join(' ')}`); return { status: 0, stdout: '' }; }
  const opts = { encoding: 'utf8', stdio: quiet ? 'pipe' : 'inherit', env: process.env };
  // Windows에서는 npx.cmd 등을 찾기 위해 셸 경유. 인자는 직접 따옴표로 감싸 한 줄로 넘긴다.
  const r = IS_WIN
    ? spawnSync([bin, ...args.map((a) => (/[\s*&|<>^"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a))].join(' '), { ...opts, shell: true })
    : spawnSync(bin, args, opts);
  if (r.status !== 0 && !allowFail) throw new Error(`${bin} ${args.join(' ')} 실패 (exit ${r.status})`);
  return r;
}
function has(bin) {
  const r = IS_WIN
    ? spawnSync(`where ${bin}`, { encoding: 'utf8', shell: true })
    : spawnSync('which', [bin], { encoding: 'utf8' });
  return r.status === 0;
}

// ---------------------------------------------------------------------------
// 현재 PC 상태 읽기
// ---------------------------------------------------------------------------
function localMarketplaces() {
  const j = readJson(path.join(CLAUDE_DIR, 'plugins', 'known_marketplaces.json'), {});
  const out = {};
  for (const [name, v] of Object.entries(j)) {
    const s = v.source || {};
    if (s.source === 'github' && s.repo) out[name] = { name, repo: s.repo };
    else if (s.source === 'git' && s.url) out[name] = { name, url: s.url };
    // directory(로컬 경로) 마켓플레이스는 다른 PC에서 의미가 없어 제외
  }
  return out;
}
function localPlugins() {
  const j = readJson(path.join(CLAUDE_DIR, 'plugins', 'installed_plugins.json'), { plugins: {} });
  const ids = [];
  for (const [id, entries] of Object.entries(j.plugins || {})) {
    if ((entries || []).some((e) => e.scope === 'user')) ids.push(id);
  }
  return ids;
}
function localLock() {
  return readJson(AGENTS_LOCK, { skills: {} }).skills || {};
}
function isRealDir(p) {
  try { const st = fs.lstatSync(p); return st.isDirectory() && !st.isSymbolicLink(); } catch { return false; }
}
function resolveSkillDir(name) {
  // ~/.claude/skills/<name> 이 링크면 실제 위치를 따라간다
  const p = path.join(USER_SKILLS, name);
  try { return fs.realpathSync(p); } catch { return null; }
}

// ---------------------------------------------------------------------------
// 파일 유틸
// ---------------------------------------------------------------------------
function listFiles(dir, base = dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p, base));
    else if (e.isFile()) out.push(path.relative(base, p));
  }
  return out.sort();
}
function sameTree(a, b) {
  if (!fs.existsSync(a) || !fs.existsSync(b)) return false;
  const fa = listFiles(a), fb = listFiles(b);
  if (fa.join('\n') !== fb.join('\n')) return false;
  return fa.every((f) => fs.readFileSync(path.join(a, f)).equals(fs.readFileSync(path.join(b, f))));
}
function copyTree(src, dst) {
  fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(dst, { recursive: true });
  for (const f of listFiles(src)) {
    fs.mkdirSync(path.dirname(path.join(dst, f)), { recursive: true });
    fs.copyFileSync(path.join(src, f), path.join(dst, f));
  }
}

// 스킬 패키지(GitHub 레포)에 실제로 있는 스킬 이름 목록. 얕은 clone 후 SKILL.md의 name: 을 읽는다.
const upstreamCache = {};
function upstreamSkills(source) {
  if (upstreamCache[source]) return upstreamCache[source];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-src-'));
  const url = /^https?:|^git@/.test(source) ? source : `https://github.com/${source}.git`;
  const r = spawnSync('git', ['clone', '--depth', '1', '-q', url, tmp], { encoding: 'utf8' });
  const names = new Set();
  if (r.status === 0) {
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (e.name === '.git' || e.name === 'node_modules') continue;
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name === 'SKILL.md') {
          const m = fs.readFileSync(p, 'utf8').match(/^name:\s*["']?([^"'\r\n]+)/m);
          names.add(m ? m[1].trim() : path.basename(d));
        }
      }
    };
    walk(tmp);
  } else {
    warn(`${source} 를 받아오지 못했습니다. 이 패키지의 스킬 분류는 건너뜁니다.`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  return (upstreamCache[source] = r.status === 0 ? names : null);
}

// ---------------------------------------------------------------------------
// install / update
// ---------------------------------------------------------------------------
function install() {
  const m = readJson(MANIFEST);
  const withOptional = flag('--with-optional');
  if (!has('claude')) {
    log('claude 명령이 없습니다. 먼저 Claude Code를 설치하세요: https://claude.com/claude-code');
    process.exit(1);
  }
  const summary = { ok: [], fail: [], skip: [] };

  log('\n[1/4] 마켓플레이스');
  const known = localMarketplaces();
  for (const mk of m.marketplaces) {
    const src = mk.repo || mk.url;
    if (known[mk.name]) {
      log(`  - ${mk.name}: 갱신`);
      run('claude', ['plugin', 'marketplace', 'update', mk.name]);
    } else {
      log(`  - ${mk.name}: 추가 (${src})`);
      const r = run('claude', ['plugin', 'marketplace', 'add', src]);
      if (r.status !== 0) summary.fail.push(`마켓플레이스 ${mk.name}`);
    }
  }

  log('\n[2/4] 플러그인');
  const installed = new Set(localPlugins());
  for (const p of m.plugins) {
    if (p.optional && !withOptional) {
      log(`  - ${p.id}: 선택 항목이라 건너뜀${p.note ? ` (${p.note})` : ''}`);
      summary.skip.push(p.id);
      continue;
    }
    const verb = installed.has(p.id) ? 'update' : 'install';
    log(`  - ${p.id}: ${verb === 'install' ? '설치' : '업데이트'}`);
    const r = run('claude', ['plugin', verb, p.id, '-s', 'user']);
    (r.status === 0 ? summary.ok : summary.fail).push(p.id);
  }

  log('\n[3/4] 스킬 패키지 (npx skills)');
  if (!has('npx')) {
    warn('npx가 없어 스킬 패키지를 건너뜁니다. Node.js를 설치한 뒤 다시 실행하세요.');
    summary.skip.push('스킬 패키지 전체');
  } else {
    for (const pkg of m.skillPackages) {
      if (pkg.skills !== '*' && !pkg.skills?.length) continue;
      const args = ['-y', 'skills', 'add', pkg.source, '-g', '-y', '-a', 'claude-code'];
      if (pkg.skills === '*') args.push('-s', '*');
      else for (const s of pkg.skills) args.push('-s', s);
      log(`  - ${pkg.source}: ${pkg.skills === '*' ? '전체' : pkg.skills.length + '개'}`);
      const r = run('npx', args, { quiet: true });
      if (r.status === 0) summary.ok.push(pkg.source);
      else { summary.fail.push(pkg.source); warn((r.stderr || r.stdout || '').slice(-400)); }
    }
  }

  log('\n[4/4] 직접 만든 스킬 (repo skills/ → ~/.claude/skills)');
  if (fs.existsSync(REPO_SKILLS)) {
    const backupRoot = path.join(CLAUDE_DIR, 'skills-backup', new Date().toISOString().replace(/[:.]/g, '-'));
    for (const name of fs.readdirSync(REPO_SKILLS)) {
      const src = path.join(REPO_SKILLS, name);
      if (!isRealDir(src)) continue;
      const dst = path.join(USER_SKILLS, name);
      if (sameTree(src, dst)) { log(`  - ${name}: 변경 없음`); continue; }
      if (fs.existsSync(dst) && !DRY) {
        fs.mkdirSync(backupRoot, { recursive: true });
        fs.cpSync(dst, path.join(backupRoot, name), { recursive: true, dereference: true });
        log(`  - ${name}: 기존 것을 ${backupRoot} 에 백업하고 교체`);
      } else log(`  - ${name}: 복사`);
      if (!DRY) { fs.mkdirSync(USER_SKILLS, { recursive: true }); copyTree(src, dst); }
      summary.ok.push(name);
    }
  }

  log('\n=== 완료 ===');
  if (summary.fail.length) log('실패:', summary.fail.join(', '));
  if (summary.skip.length) log('건너뜀:', summary.skip.join(', '));
  log('Claude Code를 다시 시작해야 플러그인 변경이 반영됩니다.');
  if (summary.fail.length) process.exitCode = 1;
}

// ---------------------------------------------------------------------------
// export: 현재 PC → manifest.json / skills/
// ---------------------------------------------------------------------------
function collectDiff() {
  const m = readJson(MANIFEST);
  const ignoreSkills = new Set(m.ignoreSkills || []);
  const ignorePlugins = new Set(m.ignorePlugins || []);
  const changes = [];

  // 마켓플레이스
  const haveMk = new Set(m.marketplaces.map((x) => x.name));
  for (const mk of Object.values(localMarketplaces())) {
    if (!haveMk.has(mk.name)) { m.marketplaces.push(mk); changes.push(`+ 마켓플레이스 ${mk.name} (${mk.repo || mk.url})`); }
  }
  const mkNames = new Set(m.marketplaces.map((x) => x.name));

  // 플러그인
  const havePl = new Set(m.plugins.map((x) => x.id));
  for (const id of localPlugins()) {
    if (havePl.has(id) || ignorePlugins.has(id)) continue;
    if (!mkNames.has(id.split('@')[1])) { warn(`${id}: 마켓플레이스를 알 수 없어 건너뜀`); continue; }
    m.plugins.push({ id }); changes.push(`+ 플러그인 ${id}`);
  }

  // 스킬 패키지 (npx skills 잠금 파일 기준)
  const pkgBySource = Object.fromEntries(m.skillPackages.map((p) => [p.source, p]));
  const lock = localLock();
  const vendor = []; // 원본 레포에서 사라진 스킬 → repo skills/ 로 보관
  for (const [name, info] of Object.entries(lock)) {
    if (ignoreSkills.has(name)) continue;
    const source = info.source;
    if (!source) continue;
    const up = upstreamSkills(source);
    if (up && !up.has(name)) { vendor.push({ name, why: `${source}에서 사라짐` }); continue; }
    let pkg = pkgBySource[source];
    if (!pkg) { pkg = pkgBySource[source] = { source, skills: [] }; m.skillPackages.push(pkg); changes.push(`+ 스킬 패키지 ${source}`); }
    if (pkg.skills !== '*' && !pkg.skills.includes(name)) { pkg.skills.push(name); changes.push(`+ 스킬 ${name} (${source})`); }
  }

  // ~/.claude/skills 에 있는 실제 폴더(링크 아님) → 직접 만든 스킬 후보
  const custom = [...vendor];
  if (fs.existsSync(USER_SKILLS)) {
    for (const name of fs.readdirSync(USER_SKILLS)) {
      if (name === 'synced' || name.startsWith('.') || ignoreSkills.has(name) || lock[name]) continue;
      const p = path.join(USER_SKILLS, name);
      if (!isRealDir(p) || !fs.existsSync(path.join(p, 'SKILL.md'))) continue;
      // 패키지 스킬을 복사해 둔 것이면 패키지 쪽으로 분류
      const owner = m.skillPackages.find((pkg) => upstreamSkills(pkg.source)?.has(name));
      if (owner) {
        if (owner.skills !== '*' && !owner.skills.includes(name)) { owner.skills.push(name); changes.push(`+ 스킬 ${name} (${owner.source}, 복사본이 있었음)`); }
        continue;
      }
      custom.push({ name, why: '로컬 전용 스킬' });
    }
  }
  // 이미 레포에 있는 스킬은 기본적으로 덮어쓰지 않는다 (PC마다 버전이 달라 마지막 export가 이기는 문제 방지).
  // 이 PC의 것으로 바꾸려면 --overwrite <이름>... 또는 --overwrite-all
  const owIdx = argv.indexOf('--overwrite');
  const overwrite = new Set(owIdx >= 0 ? argv.slice(owIdx + 1).filter((a) => !a.startsWith('--')) : []);
  const overwriteAll = flag('--overwrite-all');
  const differs = [];
  for (const { name, why } of custom) {
    const src = resolveSkillDir(name) || path.join(HOME, '.agents', 'skills', name);
    if (!src || !fs.existsSync(src)) { warn(`${name}: 원본 폴더를 찾지 못함`); continue; }
    const dst = path.join(REPO_SKILLS, name);
    if (sameTree(src, dst)) continue;
    const exists = fs.existsSync(dst);
    if (exists && !overwriteAll && !overwrite.has(name)) { differs.push(name); continue; }
    changes.push(`${exists ? '~' : '+'} skills/${name} (${why})`);
    if (!DRY && cmd === 'export') copyTree(src, dst);
  }
  if (differs.length) {
    log(`레포와 내용이 다른 스킬 ${differs.length}개는 그대로 두었습니다: ${differs.join(', ')}`);
    log('  이 PC 버전으로 올리려면:  node setup.mjs export --overwrite ' + differs[0] + '   (전부는 --overwrite-all)');
  }
  for (const pkg of m.skillPackages) if (Array.isArray(pkg.skills)) pkg.skills.sort();
  return { m, changes };
}

function exportState() {
  const { m, changes } = collectDiff();
  if (!changes.length) { log('manifest와 현재 PC가 같습니다. 추가할 것이 없습니다.'); return; }
  log('추가·변경 항목:'); for (const c of changes) log('  ' + c);
  if (DRY) { log('\n(dry-run) 파일은 바꾸지 않았습니다.'); return; }
  writeJson(MANIFEST, m);
  log('\nmanifest.json 과 skills/ 를 갱신했습니다.');
  if (flag('--push')) {
    const host = os.hostname();
    run('git', ['-C', REPO, 'add', '-A'], { allowFail: false });
    run('git', ['-C', REPO, 'commit', '-m', `export: ${host}에서 ${changes.length}건 추가`], { allowFail: false });
    run('git', ['-C', REPO, 'pull', '--rebase', '-q'], { allowFail: false });
    run('git', ['-C', REPO, 'push', '-q'], { allowFail: false });
    log('커밋하고 푸시했습니다.');
  } else {
    log(`확인 후 올리려면:  git -C "${REPO}" diff  →  node setup.mjs export --push`);
  }
}

function status() {
  const { changes } = collectDiff();
  if (!changes.length) log('이 PC에 있는데 manifest에 없는 항목: 없음');
  else { log('이 PC에 있는데 manifest에 없는 항목:'); for (const c of changes) log('  ' + c); }
  const m = readJson(MANIFEST);
  const inst = new Set(localPlugins());
  const missing = m.plugins.filter((p) => !inst.has(p.id)).map((p) => p.id + (p.optional ? ' (선택)' : ''));
  log(missing.length ? `\nmanifest에 있는데 이 PC에 없는 플러그인:\n  ${missing.join('\n  ')}` : '\nmanifest의 플러그인은 모두 설치되어 있습니다.');
}

if (cmd === 'install' || cmd === 'update') install();
else if (cmd === 'export') exportState();
else if (cmd === 'status') status();
else {
  log('사용법: node setup.mjs <install|update|export|status> [--with-optional] [--push] [--dry-run]');
  process.exit(cmd ? 1 : 0);
}
