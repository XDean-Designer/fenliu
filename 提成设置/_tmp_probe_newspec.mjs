/* 探针：1) Sheet 参数区两行居左几何；2) 选人「点任一按钮即收起 / 未选待选态 / 点掉工位」 */
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

/* ============ A. Sheet 参数区 ============ */
await page.goto(base + '?view=desktop&capture=comm2-cat-sheet', { waitUntil: 'load', timeout: 30000 });
await sleep(1900);
const snap = () => page.evaluate(() => {
  const body = document.querySelector('#comm2CatSheetBody');
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), bottom: Math.round(b.bottom) }; };
  const grid = body.querySelector('.comm2-sheet-station-grid');
  const rows = body.querySelector('.comm2-sheet-avg-rows');
  const rowInfo = (root) => root ? [...root.children].map((c) => ({
    label: (c.querySelector('.comm2-sheet-station__label') || {}).textContent,
    box: r(c), cap: r(c.querySelector('.comm2-cap') || c.querySelector('.comm2-extra-add')),
    title: c.querySelector('.comm2-cap__title') ? c.querySelector('.comm2-cap__title').textContent : '',
    capRowDir: (c.querySelector('.comm2-cap__row') || c) ? (c.querySelector('.comm2-cap__row') ? getComputedStyle(c.querySelector('.comm2-cap__row')).flexDirection : '') : '',
    dotColor: (c.querySelector('.comm2-sheet-station__dot') ? getComputedStyle(c.querySelector('.comm2-sheet-station__dot')).backgroundColor : ''),
    dashed: !!c.querySelector('.comm2-extra-add'),
    dashedTxt: c.querySelector('.comm2-extra-add__txt') ? c.querySelector('.comm2-extra-add__txt').textContent : '',
    closeBtn: !!c.querySelector('.comm2-extra-close')
  })) : [];
  return { bodyH: Math.round(body.getBoundingClientRect().height), stationRows: rowInfo(grid), avgRows: rowInfo(rows), extraStation: r(body.querySelector('.comm2-sheet-station.is-extra')) };
});
const setPick = (m) => page.evaluate((mode) => { const b = document.querySelector('#comm2CatSheetBody [data-comm2-sheet-pick="' + mode + '"]'); if (b) b.click(); }, m);

const st = await snap();
console.log('=== 按工位 ===');
console.log('bodyH', st.bodyH, 'extraStation', JSON.stringify(st.extraStation));
st.stationRows.forEach((r) => console.log(' row1', r.label, JSON.stringify(r.box), 'cap', JSON.stringify(r.cap), 'title', r.title, r.capRowDir));
await setPick('avg'); await sleep(500);
const av = await snap();
console.log('=== 不分工位（开顾客指定）===');
console.log('bodyH', av.bodyH);
av.avgRows.forEach((r) => console.log(' row', r.label, JSON.stringify(r.box), 'cap', JSON.stringify(r.cap), 'title', r.title, r.capRowDir, 'dot', r.dotColor, 'close', r.closeBtn));
console.log('抖动 bodyH:', st.bodyH, '->', av.bodyH, '差 =', av.bodyH - st.bodyH);
console.log('左边缘 x:', st.stationRows[0] && st.stationRows[0].box.x, '->', av.avgRows[0] && av.avgRows[0].box.x, '| 卡 y:', st.stationRows[0] && st.stationRows[0].box.y, '->', av.avgRows[0] && av.avgRows[0].box.y);
console.log('卡尺寸:', st.stationRows[0] && JSON.stringify(st.stationRows[0].cap), '->', av.avgRows[0] && JSON.stringify(av.avgRows[0].cap));

/* 未开顾客指定 */
await page.evaluate(() => { const b = document.querySelector('#comm2CatSheetBody [data-comm2-extra="off"]'); if (b) b.click(); });
await sleep(500);
const av2 = await snap();
console.log('=== 不分工位 + 未开顾客指定 ===');
console.log('bodyH', av2.bodyH);
av2.avgRows.forEach((r) => console.log(' row', r.label, JSON.stringify(r.box), 'cap', JSON.stringify(r.cap), 'title', r.title, 'dashed', r.dashed, r.dashedTxt, 'dot', r.dotColor));

/* ============ B. 选人交互 ============ */
const spUrl = base + '?view=desktop&capture=staff-pick-sheet';
await page.goto(spUrl, { waitUntil: 'load', timeout: 30000 });
await sleep(1600);
/* 切到 按工位 + 开顾客指定 并展开第一张卡 */
await page.evaluate(() => { window.Comm2StaffPick.setExtraSplit(true); window.Comm2StaffPick.setMode('station'); });
await sleep(300);
await page.evaluate(() => { document.querySelector('#comm2StaffSheetRoot [data-staff-card-hit]').click(); });
await sleep(700);

const spSnap = () => page.evaluate(() => {
  const root = document.querySelector('#comm2StaffSheetRoot');
  const sheet = document.querySelector('#comm2StaffSheetMask');
  return {
    open: !!(sheet && sheet.classList.contains('open')),
    hint: (document.querySelector('#comm2StaffSheetHint') || {}).textContent,
    entry: (document.querySelector('#comm2SpBlock .detail-staff-entry__val') || {}).textContent,
    summaryRows: [...document.querySelectorAll('#comm2SpBlock .detail-staff-summary__row')].map((r) => r.textContent.trim()),
    cards: [...root.querySelectorAll('.staff-card')].map((c) => ({
      id: c.getAttribute('data-staff-id'),
      cls: c.className,
      /* 十九次：收缩态员工卡已无勾选控件 → 这个字段恒为 false（保留以便回归时一眼看出） */
      tick: !!c.querySelector('[data-staff-tick]'),
      expanded: !!c.querySelector('.staff-opt'),
      pick: (c.querySelector('.staff-card__title--pick') || {}).textContent || '',
      miss: !!c.querySelector('.staff-card__pick-miss'),
      missColor: c.querySelector('.staff-card__pick-miss') ? getComputedStyle(c.querySelector('.staff-card__pick-miss')).color : '',
      xColor: c.querySelector('.staff-card__pick-x') ? getComputedStyle(c.querySelector('.staff-card__pick-x')).color : '',
      opts: [...c.querySelectorAll('[data-staff-opt]')].map((b) => b.getAttribute('data-staff-opt') + (b.classList.contains('is-on') ? ':on' : ':off'))
    }))
  };
});
const clickOpt = (key) => page.evaluate((k) => { const b = document.querySelector('#comm2StaffSheetRoot [data-staff-opt="' + k + '"]'); if (b) b.click(); }, key);
/* 始终操作**第一张卡**（它的 id 从 DOM 取，避免写死） */
const firstCardId = () => page.evaluate(() => { const c = document.querySelector('#comm2StaffSheetRoot [data-staff-card]'); return c ? c.getAttribute('data-staff-id') : ''; });
const clickFirstCard = () => page.evaluate(() => { const c = document.querySelector('#comm2StaffSheetRoot [data-staff-card-hit]'); if (c) c.click(); });
const cardSnap = (sid) => page.evaluate((id) => {
  const c = document.querySelector('#comm2StaffSheetRoot [data-staff-card][data-staff-id="' + id + '"]');
  if (!c) return null;
  return {
    id, cls: c.className,
    /* 十九次：恒为 false（卡上勾已删除） */
    tick: !!c.querySelector('[data-staff-tick]'),
    expanded: !!c.querySelector('.staff-opt'),
    pick: (c.querySelector('.staff-card__title--pick') || {}).textContent || '',
    miss: !!c.querySelector('.staff-card__pick-miss'),
    opts: [...c.querySelectorAll('[data-staff-opt]')].map((b) => b.getAttribute('data-staff-opt') + (b.classList.contains('is-on') ? ':on' : ':off'))
  };
}, sid);
const entry = () => page.evaluate(() => ({
  val: (document.querySelector('#comm2SpBlock .detail-staff-entry__val') || {}).textContent,
  rows: [...document.querySelectorAll('#comm2SpBlock .detail-staff-summary__row')].map((r) => r.textContent.trim())
}));

console.log('\n=== B1 · 展开态（按工位+顾客指定）===');
let s = await spSnap();
const FID = await firstCardId();
console.log('第一张卡 id:', FID, '| hint:', s.hint);
console.log('card0 opts:', JSON.stringify(s.cards[0].opts), 'expanded', s.cards[0].expanded);

console.log('\n=== B2 · 只点「顾客指定」→ 应立刻收起 + 未选待选态 ===');
await clickOpt('extra');
await sleep(900);
console.log('卡:', JSON.stringify(await cardSnap(FID)));
console.log('入口:', JSON.stringify(await entry()));
console.log('展开的卡数(应 0):', (await spSnap()).cards.filter((c) => c.expanded).length);

console.log('\n=== B3 · 再展开 → 点工位 → 应计入已选 + 出勾选控件 ===');
await clickFirstCard(); await sleep(700);
console.log('展开后卡:', JSON.stringify(await cardSnap(FID)));
await clickOpt('senior'); await sleep(900);
console.log('卡:', JSON.stringify(await cardSnap(FID)));
console.log('入口:', JSON.stringify(await entry()));

console.log('\n=== B4 · 再展开 → 点掉工位（点已勾选工位）→ 应落入未选待选态 ===');
await clickFirstCard(); await sleep(700);
await clickOpt('senior'); await sleep(900);
console.log('卡:', JSON.stringify(await cardSnap(FID)));
console.log('入口:', JSON.stringify(await entry()));

console.log('\n=== B5 · 再展开 → 取消顾客指定 → 应完全未选 ===');
await clickFirstCard(); await sleep(700);
await clickOpt('extra'); await sleep(900);
console.log('卡:', JSON.stringify(await cardSnap(FID)));
console.log('入口:', JSON.stringify(await entry()));

console.log('\n=== B6 · 换工位（大工 → 中工）：并行红交接 + 收起 ===');
await clickFirstCard(); await sleep(700);
await clickOpt('senior'); await sleep(900);
console.log('先选大工:', JSON.stringify(await cardSnap(FID)));
await clickFirstCard(); await sleep(700);
await page.evaluate(() => {
  const box = document.querySelector('#comm2StaffSheetRoot [data-staff-opt="mid"] .staff-opt__box');
  window.__t = { t0: performance.now(), prev: null, next: null };
  box.click();
  const prevBox = document.querySelector('#comm2StaffSheetRoot [data-staff-opt="senior"] .staff-opt__box');
  window.__t.prev = getComputedStyle(prevBox).backgroundColor;
  window.__t.next = getComputedStyle(box).backgroundColor;
  window.__t.prevCls = prevBox.closest('.staff-opt').className;
  window.__t.nextCls = box.closest('.staff-opt').className;
});
const t1 = await page.evaluate(() => window.__t);
console.log('点击瞬间 prev/next bg:', t1.prev, '/', t1.next, '| prevCls', t1.prevCls, '| nextCls', t1.nextCls);
await sleep(60);
console.log('+60ms prev bg:', await page.evaluate(() => getComputedStyle(document.querySelector('#comm2StaffSheetRoot [data-staff-opt="senior"] .staff-opt__box')).backgroundColor));
await sleep(900);
console.log('落定后卡:', JSON.stringify(await cardSnap(FID)));
console.log('入口:', JSON.stringify(await entry()));

console.log('\n=== B7 · 不分工位 + 开顾客指定：点「顾客指定」应计入已选 + 有勾 ===');
await page.evaluate(() => { window.Comm2StaffPick.setMode('avg'); });
await sleep(400);
await clickFirstCard(); await sleep(700);
console.log('展开选项:', JSON.stringify((await cardSnap(FID)).opts));
await clickOpt('extra'); await sleep(900);
console.log('卡:', JSON.stringify(await cardSnap(FID)));
console.log('入口:', JSON.stringify(await entry()));

await browser.close();
