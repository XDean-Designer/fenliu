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
  'serve.json',
  '.nojekyll',
  'package.json',
  'assets/home-full.png',
  'assets/jl-embed-coach.js',
  'assets/jl-embed-coach.css',
  'assets/triage/ico-rts.svg',
  'assets/triage/ico-rtb.svg',
  'assets/triage/ico-rtp.svg',
  'assets/triage/ico-rtl.svg',
  'assets/statusbar/ic_cellular_fig.svg',
  '价目表/index.html',
  '价目表/base.css',
  '价目表/shell.css',
  '价目表/app.js',
  '价目表/catalog.js',
  '价目表/mobile-preview.js',
  '提成设置/index.html',
  '提成设置/base.css',
  '提成设置/shell.css',
  '提成设置/app.js',
  '提成设置/employee.js',
  '开单/index.html',
  'RTS页面/b001_home.html',
  'RTS页面/rts-coach.js',
  'RTS页面/base.css'
];

const REQUIRED_DIRS = ['价目表', '提成设置', '开单', 'RTS页面', 'assets'];

/** 壳嵌壳入口（须带 index.html / 显式 html） */
const EMBED_PATHS = [
  '价目表/index.html',
  '提成设置/index.html',
  '开单/index.html',
  'RTS页面/b001_home.html'
];

/** 子模块侧栏深链（抽检：文件存在 + HTML 含 data-flow / data-target / 页面文件） */
const DEEP_LINKS = [
  { file: '价目表/index.html', marker: 'data-flow="price-list-empty"' },
  { file: '价目表/index.html', marker: 'data-flow="price-list-filled"' },
  { file: '价目表/index.html', marker: 'data-flow="price-groups"' },
  { file: '价目表/index.html', marker: 'data-flow="price-add"' },
  { file: '提成设置/index.html', marker: 'data-flow="staff-list"' },
  { file: '提成设置/index.html', marker: 'data-flow="staff-detail"' },
  { file: '提成设置/index.html', marker: 'data-flow="comm2-list"' },
  { file: '提成设置/index.html', marker: 'data-flow="staff-salary"' },
  { file: '开单/index.html', marker: 'id="s1"' },
  { file: '开单/index.html', marker: 'id="s15"' },
  { file: '开单/index.html', marker: 'data-target="s6"' },
  { file: 'RTS页面/b001_home.html', marker: 'rts-coach' },
  { file: 'RTS页面/b003_create_activity.html', marker: '' },
  { file: 'RTS页面/b003_config_activity.html', marker: '' },
  { file: 'RTS页面/b015_insider_plaza.html', marker: '' }
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
  'data-nav="embed-rts"'
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

console.log('[1] 目录');
for (const d of REQUIRED_DIRS) {
  const p = path.join(ROOT, d);
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) ok('dir ' + d);
  else fail('missing dir ' + d);
}

console.log('\n[2] 关键文件');
for (const f of REQUIRED_FILES) {
  if (existsRel(f)) ok(f);
  else fail('missing ' + f);
}

console.log('\n[3] 壳层页面锚点');
const shell = existsRel('index.html') ? readRel('index.html') : '';
for (const m of SHELL_MARKERS) {
  if (shell.includes(m)) ok('shell ' + m);
  else fail('shell missing ' + m);
}
if (shell.includes('fonts.googleapis.com')) {
  fail('shell still loads Google Fonts CDN (should be offline-safe)');
} else {
  ok('shell offline font stack (no Google Fonts CDN)');
}
if (/价目表\/index\.html/.test(shell) && /提成设置\/index\.html/.test(shell)) {
  ok('EMBED uses explicit index.html paths');
} else {
  fail('EMBED paths should keep …/index.html');
}

console.log('\n[4] 嵌壳入口文件');
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

console.log('\n[6] 尾斜杠自愈脚本（价目表 / 提成设置）');
for (const f of ['价目表/index.html', '提成设置/index.html']) {
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
    '/%E4%BB%B7%E7%9B%AE%E8%A1%A8/index.html',
    '/%E4%BB%B7%E7%9B%AE%E8%A1%A8/base.css',
    '/%E6%8F%90%E6%88%90%E8%AE%BE%E7%BD%AE/index.html',
    '/%E6%8F%90%E6%88%90%E8%AE%BE%E7%BD%AE/base.css',
    '/%E5%BC%80%E5%8D%95/index.html',
    '/RTS%E9%A1%B5%E9%9D%A2/b001_home.html'
  ];
  for (const p of paths) {
    const url = httpBase + p;
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'manual' });
      const loc = res.headers.get('location') || '';
      // 危险：/价目表 （无尾斜杠、无 index）→ 相对 CSS 指到站点根
      const slashlessDir =
        loc &&
        /\/(?:%E4%BB%B7%E7%9B%AE%E8%A1%A8|%E6%8F%90%E6%88%90%E8%AE%BE%E7%BD%AE|%E5%BC%80%E5%8D%95|RTS%E9%A1%B5%E9%9D%A2)\/?$/i.test(
          loc.split('?')[0]
        );
      if ((res.status === 301 || res.status === 302) && slashlessDir) {
        fail(p + ' redirected to slashless dir → ' + loc);
      } else if (res.status >= 200 && res.status < 400) {
        ok(res.status + (loc ? '→' + loc : '') + ' ' + p);
      } else {
        fail(res.status + ' ' + p);
      }
    } catch (err) {
      fail(p + ' ' + (err && err.message ? err.message : err));
    }
  }
}

await httpCheck();

console.log('\n' + (failed ? 'RESULT  FAIL (' + failed + ')' : 'RESULT  PASS') + '\n');
process.exit(failed ? 1 : 0);
