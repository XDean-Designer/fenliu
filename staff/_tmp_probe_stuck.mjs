/**
 * 诊断：为什么 staff-pick-avg / direct / sel 三个态在 Figma 抓取时 submit 永久 pending。
 * 思路：capture.js 需要页面「静止」才能序列化。若页面存在永不收敛的动画/布局循环，
 *       序列化就永远不会结束 -> submit 永不发出 -> 轮询永远 pending。
 * 做法：对每条路由，等稳定后观察 2s 内的 DOM 变更量 + 布局指纹是否漂移。
 */
import { existsSync } from 'node:fs';

const PORT = 8765;
const BASE = `http://127.0.0.1:${PORT}/index.html?capture=`;

let puppeteer;
const skillRoot = process.env.SKILL_DIR || 'C:\\Users\\Administrator\\.cursor\\skills\\run-to-figma';
try {
  puppeteer = await import('puppeteer-core');
} catch {
  const { createRequire } = await import('node:module');
  const { join } = await import('node:path');
  const req = createRequire(join(skillRoot, 'scripts', '_resolve.js'));
  const entry = req.resolve('puppeteer-core');
  puppeteer = await import('file:///' + entry.replaceAll('\\', '/').replace(/^\/([A-Za-z]):/, '$1:'));
}

const browserPath = [
  process.env.FIGMA_CAPTURE_BROWSER,
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => p && existsSync(p));
if (!browserPath) { console.error('no browser'); process.exit(1); }

const ROUTES = [
  'staff-pick-sheet', // 对照组：成功落位
  'staff-pick-edit',  // 对照组：成功落位
  'staff-pick-avg',   // 失败
  'staff-pick-direct',// 失败
  'staff-pick-sel',   // 失败
];

const browser = await puppeteer.launch({ executablePath: browserPath, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });

const logs = [];
page.on('console', (m) => logs.push(m.type() + ': ' + m.text().slice(0, 160)));
page.on('pageerror', (e) => logs.push('PAGEERROR: ' + String(e.message).slice(0, 200)));

for (const route of ROUTES) {
  logs.length = 0;
  await page.goto(BASE + route, { waitUntil: 'load', timeout: 20000 });
  await new Promise((r) => setTimeout(r, 3000)); // 让路由动画播完

  const out = await page.evaluate(async () => {
    // 1) 布局指纹：收集 #frame 内所有元素的 rect，串成字符串
    const fingerprint = () => {
      const root = document.querySelector('#frame');
      if (!root) return 'no-frame';
      const parts = [];
      root.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        parts.push(Math.round(r.x) + ',' + Math.round(r.y) + ',' + Math.round(r.width) + ',' + Math.round(r.height));
      });
      return parts.join('|');
    };

    const fp1 = fingerprint();
    // 2) 2s 内观测 DOM 变更
    let mutations = 0;
    const attrHits = {};
    const targetHits = {};
    const mo = new MutationObserver((recs) => {
      for (const r of recs) {
        mutations++;
        const t = r.target;
        const key = (t.id ? '#' + t.id : t.className && typeof t.className === 'string' ? '.' + t.className.split(/\s+/)[0] : t.tagName) || t.tagName;
        targetHits[key] = (targetHits[key] || 0) + 1;
        if (r.type === 'attributes') attrHits[r.attributeName] = (attrHits[r.attributeName] || 0) + 1;
      }
    });
    mo.observe(document.querySelector('#frame') || document.body, {
      subtree: true, childList: true, attributes: true, characterData: true,
    });
    // 3) 同时统计 rAF 帧里 style 是否持续变化
    let rafFrames = 0;
    const t0 = performance.now();
    await new Promise((resolve) => {
      const tick = () => {
        rafFrames++;
        if (performance.now() - t0 < 2000) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    mo.disconnect();
    const fp2 = fingerprint();

    const top = Object.entries(targetHits).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return {
      mutations,
      rafFrames,
      attrHits,
      topTargets: top,
      layoutDrift: fp1 === fp2 ? 'stable' : 'CHANGING',
      fpLen: fp1.length,
    };
  });

  const drift = out.layoutDrift === 'stable' ? 'stable ' : 'DRIFT  ';
  console.log(
    `${route.padEnd(19)} mutations=${String(out.mutations).padStart(6)}  ${drift}` +
    ` raf=${out.rafFrames}  nodes=${out.fpLen}` +
    (out.mutations ? '  top=' + JSON.stringify(out.topTargets) + '  attrs=' + JSON.stringify(out.attrHits) : '')
  );
  const errs = logs.filter((l) => l.startsWith('PAGEERROR') || l.startsWith('error'));
  if (errs.length) console.log('    console:', errs.slice(0, 4).join(' | '));
}

await browser.close();
