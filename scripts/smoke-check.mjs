#!/usr/bin/env node
/**
 * fenliu 演示包自检：只依赖本仓库文件树（可选再打本地 HTTP）。
 *   node scripts/smoke-check.mjs
 *   node scripts/smoke-check.mjs --http http://127.0.0.1:8765
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const httpIdx = args.indexOf('--http');
const httpBase = httpIdx >= 0 ? String(args[httpIdx + 1] || '').replace(/\/$/, '') : '';

const REQUIRED_FILES = [
  'index.html',
  'jl-rtb-shell.js',
  'package.json',
  '.nojekyll',
  'assets/home-full.png',
  'assets/jl-embed-coach.js',
  'assets/jl-embed-coach.css',
  'assets/triage/ico-rts.svg',
  'assets/triage/ico-rtb.svg',
  'assets/triage/ico-rtp.svg',
  'assets/triage/ico-rtl.svg',
  'assets/statusbar/ic_cellular_fig.svg',
  'price/index.html',
  'price/base.css',
  'price/shell.css',
  'price/app.js',
  'price/catalog.js',
  'price/mobile-preview.js',
  'staff/index.html',
  'staff/base.css',
  'staff/shell.css',
  'staff/app.js',
  'staff/employee.js',
  'bill/index.html',
  'rts/b001_home.html',
  'rts/rts-coach.js',
  'rts/base.css',
  'rts/skin.css',
  'rts/rts-coach.css'
];

const REQUIRED_DIRS = ['price', 'staff', 'bill', 'rts', 'assets'];

const EMBED_PATHS = [
  'price/index.html',
  'staff/index.html',
  'bill/index.html',
  'rts/b001_home.html'
];

const DEEP_LINKS = [
  { file: 'price/index.html', marker: 'data-flow="price-list-empty"' },
  { file: 'price/index.html', marker: 'data-flow="price-list-filled"' },
  { file: 'price/index.html', marker: 'data-flow="price-groups"' },
  { file: 'price/index.html', marker: 'data-flow="price-add"' },
  { file: 'staff/index.html', marker: 'data-flow="staff-list"' },
  { file: 'staff/index.html', marker: 'data-flow="staff-detail"' },
  { file: 'staff/index.html', marker: 'data-flow="comm2-list"' },
  { file: 'staff/index.html', marker: 'data-flow="staff-salary"' },
  { file: 'bill/index.html', marker: 'id="s1"' },
  { file: 'bill/index.html', marker: 'id="s15"' },
  { file: 'bill/index.html', marker: 'data-target="s6"' },
  { file: 'rts/b001_home.html', marker: 'rts-coach' },
  { file: 'rts/b003_create_activity.html', marker: '' },
  { file: 'rts/b003_config_activity.html', marker: '' },
  { file: 'rts/b015_insider_plaza.html', marker: '' }
];

const SHELL_MARKERS = [
  'id="screen-triage"',
  'id="screen-home"',
  'id="screen-embed"',
  'id="screen-rtp-home"',
  'id="screen-rtl-home"',
  'id="screen-card-manage"',
  'id="screen-flow-ph"',
  'id="retriageMask"',
  'data-nav="embed-price"',
  'data-nav="embed-staff"',
  'data-nav="embed-bill"',
  'data-nav="embed-rts"',
  "price: 'price/index.html",
  "rts: 'rts/b001_home.html"
];

let failed = 0;
function ok(msg) {
  console.log('  PASS  ' + msg);
}
function fail(msg) {
  failed += 1;
  console.error('  FAIL  ' + msg);
}

function existsRel(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function readRel(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

console.log('\nfenliu smoke-check  root=' + ROOT + '\n');

console.log('[1] 目录（ASCII）');
for (const d of REQUIRED_DIRS) {
  const p = path.join(ROOT, d);
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) ok('dir ' + d);
  else fail('missing dir ' + d);
}
for (const legacy of ['价目表', '提成设置', '开单', 'RTS页面']) {
  if (existsRel(legacy)) fail('legacy Chinese dir still present: ' + legacy + '（应已改为 ASCII）');
  else ok('no legacy dir ' + legacy);
}

console.log('\n[2] 关键文件');
for (const f of REQUIRED_FILES) {
  if (existsRel(f)) ok(f);
  else fail('missing ' + f);
}

console.log('\n[3] 壳层页面锚点 / ASCII EMBED');
const shell = existsRel('index.html') ? readRel('index.html') : '';
for (const m of SHELL_MARKERS) {
  if (shell.includes(m)) ok('shell ' + m);
  else fail('shell missing ' + m);
}
if (shell.includes('fonts.googleapis.com')) {
  fail('shell still loads Google Fonts CDN');
} else {
  ok('shell offline font stack');
}
if (/价目表\/index\.html|RTS页面\//.test(shell)) {
  fail('shell EMBED still uses Chinese folder paths');
} else {
  ok('shell EMBED uses ASCII paths only');
}

console.log('\n[4] 嵌壳入口');
for (const f of EMBED_PATHS) {
  if (existsRel(f)) ok('embed ' + f);
  else fail('embed missing ' + f);
}

console.log('\n[5] 子模块深链 / 演示页');
for (const item of DEEP_LINKS) {
  if (!existsRel(item.file)) {
    fail('deeplink file missing ' + item.file);
    continue;
  }
  if (!item.marker) {
    ok(item.file);
    continue;
  }
  const html = readRel(item.file);
  if (html.includes(item.marker)) ok(item.file + ' · ' + item.marker);
  else fail(item.file + ' missing ' + item.marker);
}

console.log('\n[6] 尾斜杠自愈（price / staff）');
for (const f of ['price/index.html', 'staff/index.html']) {
  const html = existsRel(f) ? readRel(f) : '';
  if (html.includes('location.replace') && html.includes("path.charAt(path.length - 1) !== '/'")) {
    ok(f + ' has slash repair');
  } else {
    fail(f + ' missing slash repair bootstrap');
  }
}

async function httpCheck() {
  if (!httpBase) {
    console.log('\n[7] HTTP 跳过（加 --http http://127.0.0.1:8765 可测服务）');
    return;
  }
  console.log('\n[7] HTTP ' + httpBase);
  const paths = [
    '/index.html',
    '/jl-rtb-shell.js',
    '/assets/home-full.png',
    '/price/index.html',
    '/price/base.css',
    '/staff/index.html',
    '/staff/base.css',
    '/bill/index.html',
    '/rts/b001_home.html',
    '/rts/base.css',
    '/rts/rts-coach.js'
  ];
  for (const p of paths) {
    const url = httpBase + p;
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'manual' });
      const loc = res.headers.get('location') || '';
      if (res.status >= 200 && res.status < 400) ok(res.status + (loc ? '→' + loc : '') + ' ' + p);
      else fail(res.status + ' ' + p);
    } catch (err) {
      fail(p + ' ' + (err && err.message ? err.message : err));
    }
  }
}

await httpCheck();

console.log('\n' + (failed ? 'RESULT  FAIL (' + failed + ')' : 'RESULT  PASS') + '\n');
process.exit(failed ? 1 : 0);
