/* 探针：规则设置 Sheet 参数区在「按工位 / 不分工位」两种模式下的几何差异（窗口抖动量化） */
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
const URL = 'file:///D:/RTB%E6%89%93%E8%A1%A5%E4%B8%81%E5%B7%A5%E7%A8%8B/%E6%8F%90%E6%88%90%E8%AE%BE%E7%BD%AE/index.html?view=desktop&capture=comm2-cat-sheet';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: browserPath, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 880, deviceScaleFactor: 2 });
await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
await sleep(1900);

const snap = () => page.evaluate(() => {
  const body = document.querySelector('#comm2CatSheetBody');
  const sheet = document.querySelector('#comm2CatSheet');
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), bottom: Math.round(b.bottom) }; };
  const grid = body.querySelector('.comm2-sheet-station-grid');
  const avg = body.querySelector('.comm2-sheet-avg-cols');
  const pair = body.querySelector('.comm2-extra-row--pair');
  return {
    sheetH: sheet ? Math.round(sheet.getBoundingClientRect().height) : 0,
    bodyH: Math.round(body.getBoundingClientRect().height),
    bodyBottom: Math.round(body.getBoundingClientRect().bottom),
    grid: r(grid), avg: r(avg), pair: r(pair),
    stations: grid ? [...grid.querySelectorAll('.comm2-sheet-station')].map((s) => ({ label: (s.querySelector('.comm2-sheet-station__label') || {}).textContent, box: r(s), cap: r(s.querySelector('.comm2-cap')), capRowDir: s.querySelector('.comm2-cap__row') ? getComputedStyle(s.querySelector('.comm2-cap__row')).flexDirection : '' })) : [],
    extraStation: r(body.querySelector('.comm2-sheet-station.is-extra')),
    avgCols: avg ? [...avg.querySelectorAll('.comm2-sheet-station')].map((s) => ({ label: (s.querySelector('.comm2-sheet-station__label') || {}).textContent, box: r(s), cap: r(s.querySelector('.comm2-cap')), capRowDir: s.querySelector('.comm2-cap__row') ? getComputedStyle(s.querySelector('.comm2-cap__row')).flexDirection : '', title: s.querySelector('.comm2-cap__title') ? s.querySelector('.comm2-cap__title').textContent : '' })) : [],
    pairCards: pair ? [...pair.children].map((c) => ({ cls: c.className.split(' ')[0], title: c.querySelector('.comm2-cap__title') ? c.querySelector('.comm2-cap__title').textContent : '', box: r(c) })) : [],
    pickMode: (() => { const on = body.querySelector('[data-comm2-sheet-pick].is-on'); return on ? on.getAttribute('data-comm2-sheet-pick') : '?'; })(),
    extraSplitLen: body.querySelectorAll('.comm2-cap--extra').length
  };
});

const setPick = (v) => page.evaluate((mode) => {
  const b = document.querySelector('#comm2CatSheetBody [data-comm2-sheet-pick="' + mode + '"]');
  if (b) { b.click(); return true; }
  return false;
}, v);

console.log('初始 pickMode:', (await snap()).pickMode);
const s1 = await snap();
console.log('\n=== 按工位（station）===');
console.log(JSON.stringify(s1, null, 1));

await setPick('avg');
await sleep(500);
const s2 = await snap();
console.log('\n=== 不分工位（avg）—— 开顾客指定 ===');
console.log(JSON.stringify(s2, null, 1));

console.log('\n--- 抖动量化 ---');
console.log('bodyH:', s1.bodyH, '->', s2.bodyH, '  差 =', s2.bodyH - s1.bodyH);
console.log('sheetH:', s1.sheetH, '->', s2.sheetH, '  差 =', s2.sheetH - s1.sheetH);
console.log('第一行卡 h:', (s1.stations[0] || {}).cap && s1.stations[0].cap.h, '->', (s2.avgCols[0] || {}).cap && s2.avgCols[0].cap.h);
console.log('第一行卡 w:', (s1.stations[0] || {}).cap && s1.stations[0].cap.w, '->', (s2.avgCols[0] || {}).cap && s2.avgCols[0].cap.w);

/* 未开顾客指定：不分工位 + 无顾客指定 */
await page.evaluate(() => { const b = document.querySelector('#comm2CatSheetBody [data-comm2-extra="off"]'); if (b) b.click(); });
await sleep(500);
const s3 = await snap();
console.log('\n=== 不分工位 + 未开顾客指定 ===');
console.log('pairCards:', JSON.stringify(s3.pairCards, null, 1));
console.log('bodyH:', s3.bodyH);

await browser.close();
