/* 临时探针：量取选人网格几何（gridW / cellW / dx / origin）与关键盒尺寸，供 PRD §12.3.0.6 几何契约引用。
   只读，不改状态。 */
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
await page.goto(base, { waitUntil: 'load' });
await sleep(320);

async function openSheet() {
  await page.evaluate(() => {
    window.showOnlyScreen('screen-comm2-staff-pick');
    const entry = document.querySelector('[data-open-comm2-sp-staff]');
    if (entry) entry.click();
  });
  await sleep(140);
}

async function measure(label, mode, extra) {
  await page.evaluate((m, e) => {
    window.Comm2StaffPick.setMode(m);
    window.Comm2StaffPick.setExtraSplit(e);
  }, mode, extra);
  await sleep(120);
  await openSheet();
  await page.evaluate(() => {
    const root = document.getElementById('comm2StaffSheetRoot');
    const hit = root.querySelector('[data-staff-card-hit]');
    if (hit) hit.click();
  });
  await sleep(520);
  const out = await page.evaluate(() => {
    const root = document.getElementById('comm2StaffSheetRoot');
    const grid = root.querySelector('.staff-grid');
    const cards = [...grid.querySelectorAll(':scope > .staff-card')];
    const editing = cards.find((c) => c.classList.contains('is-editing'));
    const cs = getComputedStyle(grid);
    const gw = grid.clientWidth;
    const gap = parseFloat(cs.columnGap);
    return {
      gridW: gw,
      colGap: gap,
      rowGap: parseFloat(cs.rowGap),
      cellW: Math.round(((gw - gap * 2) / 3) * 1000) / 1000,
      cardCount: cards.length,
      editingIdx: cards.indexOf(editing),
      editingWidth: editing ? Math.round(editing.getBoundingClientRect().width * 100) / 100 : null,
      editingTransform: editing ? getComputedStyle(editing).transform : null,
      optCount: root.querySelectorAll('.staff-opt').length,
      optW: root.querySelector('.staff-opt') ? Math.round(root.querySelector('.staff-opt').getBoundingClientRect().width * 100) / 100 : null,
      panelH: Math.round(root.querySelector('.staff-card.is-editing .staff-card__panel[data-face="opts"]').getBoundingClientRect().height),
      collapsedMinH: getComputedStyle(root.querySelector('.staff-card')).minHeight,
      staffCardMinH: getComputedStyle(collapsedEl(root)).minHeight,
      boxW: (() => { const b = root.querySelector('.staff-opt__box'); const r = b.getBoundingClientRect(); return [Math.round(r.width * 100) / 100, Math.round(r.height * 100) / 100]; })(),
      optTransformOrigin: root.querySelector('.staff-opt') ? getComputedStyle(root.querySelector('.staff-opt')).transformOrigin : null,
    };
    function collapsedEl(r) { return r.querySelector('.staff-card:not(.is-editing)') || r.querySelector('.staff-card'); }
  });
  console.log('--- ' + label + ' ---');
  console.log(JSON.stringify(out, null, 1));
}

await measure('按工位 + 开顾客指定（4 张选项卡）', 'station', true);
await measure('不分工位 + 开顾客指定（2 张选项卡）', 'avg', true);

// 各列 dx：分别展开第 0 / 1 / 2 / 3 张
await page.evaluate(() => { window.Comm2StaffPick.setMode('station'); window.Comm2StaffPick.setExtraSplit(true); });
await sleep(140);
for (const idx of [0, 1, 2, 3]) {
  await openSheet();
  await page.evaluate((i) => {
    const root = document.getElementById('comm2StaffSheetRoot');
    const hits = [...root.querySelectorAll('[data-staff-card-hit]')];
    if (hits[i]) hits[i].click();
  }, idx);
  await sleep(520);
  const out = await page.evaluate((i) => {
    const root = document.getElementById('comm2StaffSheetRoot');
    const grid = root.querySelector('.staff-grid');
    const cards = [...grid.querySelectorAll(':scope > .staff-card')];
    const editing = cards.find((c) => c.classList.contains('is-editing'));
    const w = editing.getBoundingClientRect().width;
    const m = new DOMMatrixReadOnly(getComputedStyle(editing).transform);
    return { idx: i, col: i % 3, width: Math.round(w * 100) / 100, dx: Math.round(m.m41 * 100) / 100 };
  }, idx);
  console.log('dx | 第 ' + idx + ' 张（列 ' + out.col + '）: width=' + out.width + ' dx=' + out.dx);
  // 点别处收起
  await page.evaluate(() => { const s = document.querySelector('.staff-card-scrim'); if (s) s.click(); });
  await sleep(400);
}

await browser.close();
