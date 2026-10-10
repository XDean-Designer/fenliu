import { existsSync } from 'node:fs';

const PORT = 8765;
const BASE = `http://127.0.0.1:${PORT}/index.html?view=desktop&capture=`;

let puppeteer;
try { puppeteer = await import('puppeteer-core'); } catch {
  const { createRequire } = await import('node:module');
  const { join } = await import('node:path');
  const req = createRequire(join('C:\\Users\\Administrator\\.cursor\\skills\\run-to-figma\\scripts', '_resolve.js'));
  const entry = req.resolve('puppeteer-core');
  puppeteer = await import('file:///' + entry.replaceAll('\\', '/').replace(/^\/([A-Za-z]):/, '$1:'));
}
const browserPath = [
  process.env.FIGMA_CAPTURE_BROWSER,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => p && existsSync(p));

const browser = await puppeteer.launch({ executablePath: browserPath, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

async function open(key) {
  await page.goto(BASE + key, { waitUntil: 'load', timeout: 20000 });
  await new Promise((r) => setTimeout(r, 2500));
}

// --- A) 编辑页：哪些「置脏」控件真实存在 ---
await open('comm2-edit');
const editProbe = await page.evaluate(() => {
  const cards = Array.from(document.querySelectorAll('#comm2EditCards [data-comm2-rule-card]'));
  return {
    cardCount: cards.length,
    cards: cards.map((c) => ({
      id: c.getAttribute('data-comm2-rule-card'),
      hasBaseSeg: !!c.querySelector('[data-comm2-card-base]'),
      baseSeg: Array.from(c.querySelectorAll('[data-comm2-card-base]')).map((b) => b.getAttribute('data-comm2-card-base')),
      scopeChips: Array.from(c.querySelectorAll('[data-comm2-card-scope]')).map((b) => b.getAttribute('data-comm2-card-scope') + (b.classList.contains('on') ? ':on' : ':off')),
      fixed: !!c.querySelector('.comm2-rule-bar__base.is-fixed'),
      openBtn: !!c.querySelector('[data-comm2-card-open]'),
    })),
  };
});
console.log('=== comm2-edit toggles ===');
console.log(JSON.stringify(editProbe, null, 2));

// 试：点第一个存在的 base seg → 再看回退是否弹「尚未保存」
const tryBase = await page.evaluate(() => {
  const el = document.querySelector('#comm2EditCards [data-comm2-card-base]');
  if (!el) return 'no base seg';
  el.click();
  return 'clicked ' + el.getAttribute('data-comm2-card-base');
});
await new Promise((r) => setTimeout(r, 400));
const afterBase = await page.evaluate(() => {
  const m = document.getElementById('comm2UnsavedMask');
  const b = document.getElementById('comm2EditBack');
  if (b) b.click();
  return { clickedBack: !!b };
});
await new Promise((r) => setTimeout(r, 500));
const unsavedState = await page.evaluate(() => {
  const m = document.getElementById('comm2UnsavedMask');
  if (!m) return 'no mask el';
  const cs = getComputedStyle(m);
  return { cls: m.className, display: cs.display, opacity: cs.opacity, visible: cs.display !== 'none' && cs.opacity !== '0' };
});
console.log('=== comm2-unsaved via base seg ===');
console.log(tryBase, JSON.stringify(afterBase), JSON.stringify(unsavedState));

// --- B) 列表页：未分配 tip 是否可见 ---
await open('comm2-list');
const tipProbe = await page.evaluate(() => {
  const tip = document.getElementById('comm2UnassignedTip');
  if (!tip) return 'no tip el';
  const cs = getComputedStyle(tip);
  return {
    cls: tip.className,
    hidden: tip.classList.contains('hidden'),
    display: cs.display,
    text: (tip.textContent || '').trim().slice(0, 40),
  };
});
console.log('=== comm2-list unassigned tip ===');
console.log(JSON.stringify(tipProbe, null, 2));

await browser.close();
