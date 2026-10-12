import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
const skillRoot = 'C:\\Users\\Administrator\\.cursor\\skills\\run-to-figma';
let puppeteer;
try { puppeteer = await import('puppeteer-core'); } catch {
  const req = createRequire(join(skillRoot, 'scripts', '_resolve.js'));
  puppeteer = await import('file:///' + req.resolve('puppeteer-core').replaceAll('\\', '/').replace(/^\/([A-Za-z]):/, '$1:'));
}
const browserPath = [
  process.env.FIGMA_CAPTURE_BROWSER,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => p && existsSync(p));
const base = 'file:///D:/RTB%E6%89%93%E8%A1%A5%E4%B8%81%E5%B7%A5%E7%A8%8B/%E6%8F%90%E6%88%90%E8%AE%BE%E7%BD%AE/index.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: browserPath, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 880, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.text().indexOf('[dbg]') === 0) console.log(m.text()); });

await page.goto(base + '?view=desktop', { waitUntil: 'load', timeout: 30000 });
await sleep(1500);
await page.evaluate(() => { window.Comm2Demo.openList(); window.Comm2Demo.openEdit(window.Comm2Demo.getSchemes()[0].id); });
await sleep(600);
await page.evaluate(() => { const b = document.querySelector('#comm2EditCards [data-comm2-card-open]'); if (b) b.click(); });
await sleep(600);

/* 装一个探针：记录 CatSheetBody 上收到的点击目标 */
await page.evaluate(() => {
  window.__hits = [];
  document.getElementById('comm2CatSheetBody').addEventListener('click', (e) => {
    window.__hits.push({
      tag: e.target.tagName, cls: e.target.className && e.target.className.baseVal !== undefined ? '(svg)' : e.target.className,
      helpAttr: e.target.closest && e.target.closest('[data-comm2-sheet-help]') ? e.target.closest('[data-comm2-sheet-help]').getAttribute('data-comm2-sheet-help') : null,
      t: Date.now()
    });
  }, true); /* 捕获阶段，确保能看到事件是否到达 */
});

const geom = await page.evaluate(() => {
  const b = document.querySelector('#comm2CatSheetBody [data-comm2-sheet-help="base"]');
  const r = b.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const top = document.elementFromPoint(cx, cy);
  return {
    rect: { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
    topTag: top ? top.tagName : null,
    topCls: top ? (typeof top.className === 'string' ? top.className : '(svg)') : null,
    topIsMeOrChild: top ? (top === b || b.contains(top)) : null,
  };
});
console.log('geom:', JSON.stringify(geom));

/* 1) 鼠标点击 */
await page.click('#comm2CatSheetBody [data-comm2-sheet-help="base"]');
await sleep(350);
console.log('after mouseClick | hits:', JSON.stringify(await page.evaluate(() => window.__hits)));
console.log('  base mask:', await page.evaluate(() => document.getElementById('comm2BaseHelpMask').className));

/* 2) JS 原生 click */
await page.evaluate(() => { document.querySelector('#comm2CatSheetBody [data-comm2-sheet-help="base"]').click(); });
await sleep(350);
console.log('after jsClick   | base mask:', await page.evaluate(() => document.getElementById('comm2BaseHelpMask').className));
console.log('  hits:', JSON.stringify(await page.evaluate(() => window.__hits)));
console.log('  openDialog present:', await page.evaluate(() => typeof window.Comm2Demo));

await browser.close();
