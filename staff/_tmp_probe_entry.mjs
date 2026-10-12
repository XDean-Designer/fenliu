/* 探针 2：收起 Sheet（点「完成」）后，入口「已选 N 人」与员工摘要列表是否与新规则一致 */
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

const clickOpt = (k) => page.evaluate((key) => { const b = document.querySelector('#comm2StaffSheetRoot [data-staff-opt="' + key + '"]'); if (b) b.click(); }, k);
const clickFirstCard = () => page.evaluate(() => { const c = document.querySelector('#comm2StaffSheetRoot [data-staff-card-hit]'); if (c) c.click(); });
const clickDone = () => page.evaluate(() => { const b = document.querySelector('#comm2StaffSheetDone'); if (b) b.click(); });
const entry = () => page.evaluate(() => ({
  val: (document.querySelector('#comm2SpBlock .detail-staff-entry__val') || {}).textContent,
  rows: [...document.querySelectorAll('#comm2SpBlock .detail-staff-summary__row')].map((r) => ({
    name: (r.querySelector('.detail-staff-summary__name') || {}).textContent,
    role: (r.querySelector('.detail-staff-summary__role') || {}).textContent,
    meta: (r.querySelector('.detail-staff-summary__meta') || {}).textContent
  })),
  cardCls: (document.querySelector('#comm2StaffSheetRoot [data-staff-card]') || {}).className || '(sheet 已关)'
}));

for (const [label, mode, extra] of [['按工位 + 顾客指定', 'station', true], ['不分工位 + 顾客指定', 'avg', true]]) {
  await page.goto(base + '?view=desktop&capture=staff-pick-sheet', { waitUntil: 'load', timeout: 30000 });
  await sleep(1500);
  await page.evaluate((m, e) => { window.Comm2StaffPick.setMode(m); window.Comm2StaffPick.setExtraSplit(e); }, mode, extra);
  await sleep(300);
  console.log('\n########', label, '########');

  /* 1) 只勾「顾客指定」→ 收起 → 收 Sheet → 看入口 */
  await page.evaluate(() => { const c = document.querySelector('#comm2StaffSheetRoot [data-staff-card-hit]'); if (c) c.click(); });
  await sleep(700);
  await clickOpt('extra'); await sleep(900);
  await clickDone(); await sleep(500);
  console.log('① 只勾顾客指定 →', JSON.stringify(await entry()));

  /* 2) 再展开 → 点工位 → 收 Sheet */
  await page.evaluate(() => { const b = document.querySelector('#comm2SpBlock [data-open-comm2-sp-staff]'); if (b) b.click(); });
  await sleep(600);
  await clickFirstCard(); await sleep(700);
  await clickOpt(mode === 'station' ? 'senior' : 'avg'); await sleep(900);
  await clickDone(); await sleep(500);
  console.log('② 再点工位/提成 →', JSON.stringify(await entry()));

  /* 3) 再展开 → 点掉工位/普通 → 收 Sheet */
  await page.evaluate(() => { const b = document.querySelector('#comm2SpBlock [data-open-comm2-sp-staff]'); if (b) b.click(); });
  await sleep(600);
  await clickFirstCard(); await sleep(700);
  await clickOpt(mode === 'station' ? 'senior' : 'avg'); await sleep(900);
  await clickDone(); await sleep(500);
  console.log('③ 点掉工位/取消提成 →', JSON.stringify(await entry()));
}

await browser.close();
