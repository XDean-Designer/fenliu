/* 探针（十九次）：1) 收缩态员工卡无勾选控件 / 展开态选项卡勾选控件保留；
   2) 收起 Morph 动画（220ms 反向、两层交叉淡入淡出、同行卡片淡入回）；
   3) 「提成」→「服务提成」 */
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

let fails = 0;
const log = (ok, name, extra) => {
  if (!ok) fails++;
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (extra !== undefined ? ' | ' + JSON.stringify(extra) : ''));
};

const browser = await puppeteer.launch({ executablePath: browserPath, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 880, deviceScaleFactor: 2 });

const goto = async (cap) => { await page.goto(base + '?view=desktop&capture=' + cap, { waitUntil: 'load', timeout: 30000 }); await sleep(1900); };
const clickOpt = (key) => page.evaluate((k) => { const b = document.querySelector('#comm2StaffSheetRoot [data-staff-opt="' + k + '"]'); if (b) b.click(); }, key);
const clickFirstCard = () => page.evaluate(() => { const c = document.querySelector('#comm2StaffSheetRoot [data-staff-card-hit]'); if (c) c.click(); });
const firstCardId = () => page.evaluate(() => { const c = document.querySelector('#comm2StaffSheetRoot [data-staff-card]'); return c ? c.getAttribute('data-staff-id') : ''; });

/* ============ A. 勾选控件分布 ============ */
await goto('staff-pick-sheet');
const FID = await firstCardId();

const tickAudit = () => page.evaluate(() => {
  const cards = [...document.querySelectorAll('#comm2StaffSheetRoot .staff-card')];
  return {
    cardTicks: document.querySelectorAll('#comm2StaffSheetRoot .staff-card__tick, #comm2StaffSheetRoot [data-staff-tick]').length,
    optBoxes: document.querySelectorAll('#comm2StaffSheetRoot .staff-opt__box').length,
    editCards: cards.filter((c) => c.classList.contains('is-editing')).length,
    collapsed: cards.filter((c) => !c.classList.contains('is-editing')).length
  };
});

console.log('\n=== A1 · 展开态：选项卡勾选控件在、员工卡勾选控件一律不在 ===');
await clickFirstCard(); await sleep(760);
let a = await tickAudit();
log(a.editCards === 1 && a.optBoxes === 4 && a.cardTicks === 0,
  'A1 展开态 4 张选项卡各 1 个勾选控件；整表无 .staff-card__tick', a);

console.log('\n=== A2 · 收起后（已选员工卡）：仍然没有任何勾选控件 ===');
await clickOpt('senior');
await sleep(1200);
a = await tickAudit();
const collapsedTick = await page.evaluate((id) => {
  const c = document.querySelector('#comm2StaffSheetRoot [data-staff-card][data-staff-id="' + id + '"]');
  return c ? { cls: c.className, hasTick: !!c.querySelector('[data-staff-tick]'), panels: c.querySelectorAll('.staff-card__panel').length } : null;
}, FID);
log(a.cardTicks === 0 && collapsedTick && !collapsedTick.hasTick && /is-done/.test(collapsedTick.cls),
  'A2 收缩态已选员工卡无勾选控件（保留 is-done 选中态样式）', collapsedTick);

console.log('\n=== A3 · 「提成」→「服务提成」（不分工位）===');
await goto('staff-pick-sheet');
const avgLabels = await page.evaluate(() => {
  document.querySelectorAll('#comm2StaffPickMode [data-comm2-sp-mode]').forEach((b) => { if (b.getAttribute('data-comm2-sp-mode') === 'avg') b.click(); });
  return null;
});
await sleep(400);
await clickFirstCard(); await sleep(760);
const avgOpts = await page.evaluate(() => [...document.querySelectorAll('#comm2StaffSheetRoot [data-staff-opt]')]
  .map((b) => (b.querySelector('.staff-opt__txt') || {}).textContent));
log(avgOpts.length === 2 && avgOpts.indexOf('服务提成') >= 0 && avgOpts.indexOf('顾客指定') >= 0,
  'A3 不分工位展开态两张卡 = 「服务提成」「顾客指定」', avgOpts);

/* ============ B. 收起 Morph ============ */
console.log('\n=== B · 收起动画（点选项卡后收起）===');
await goto('staff-pick-sheet');
await clickFirstCard(); await sleep(760);

/* 采样：点「大工」后逐帧记录 —— 正在展开的那张卡的宽度、is-collapsing、两层 opacity、同行卡片。
   注意：落定会 `innerHTML` 重建选择器区 → 必须**每帧重新查询** live DOM，
   并在检测到重建（捕获的 grid 已不在文档里）时立即停止采样，否则量到的是冻结的旧树。 */
const sampled = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const root = document.querySelector('#comm2StaffSheetRoot');
  const liveGrid = () => document.querySelector('#comm2StaffSheetRoot .staff-grid');
  const firstGrid = liveGrid();
  const t0 = performance.now();
  const frames = [];
  const b = root.querySelector('[data-staff-opt="senior"]');
  const id = b.getAttribute('data-staff-id');
  b.click();
  for (let i = 0; i < 90; i++) {
    const grid = liveGrid();
    if (!grid || grid !== firstGrid) break;              /* 已重绘 → 停止 */
    const c = grid.querySelector(':scope > .staff-card[data-staff-id="' + id + '"]');
    if (!c) break;
    const opts = c.querySelector('.staff-card__opts');
    const base = c.querySelector('.staff-card__panel--base');
    const sibs = [...grid.querySelectorAll(':scope > .staff-card')].filter((x) => x !== c && x.getBoundingClientRect().top === c.getBoundingClientRect().top);
    frames.push({
      t: Math.round(performance.now() - t0),
      w: Math.round(c.getBoundingClientRect().width),
      cls: c.className,
      collapsing: c.classList.contains('is-collapsing'),
      optsOp: opts ? +getComputedStyle(opts).opacity : null,
      baseOp: base ? +getComputedStyle(base).opacity : null,
      muted: sibs.filter((x) => x.classList.contains('is-row-muted')).length,
      sibOp: sibs.length ? +getComputedStyle(sibs[0]).opacity : null
    });
    await sleep(16);
  }
  return { id, frames };
});

const fr = sampled.frames;
const collapsingFrames = fr.filter((f) => f.collapsing);
const widths = [...new Set(fr.map((f) => f.w))].sort((x, y) => y - x);
const distinctWidths = widths.filter((w) => w > 0).length;
const firstT = collapsingFrames.length ? collapsingFrames[0].t : -1;
const lastT = collapsingFrames.length ? collapsingFrames[collapsingFrames.length - 1].t : -1;
const optsOps = [...new Set(collapsingFrames.map((f) => f.optsOp).filter((v) => v !== null))];
const baseOps = [...new Set(collapsingFrames.map((f) => f.baseOp).filter((v) => v !== null))];
const lastFrameT = fr.length ? fr[fr.length - 1].t : -1;

log(collapsingFrames.length > 0 && lastT - firstT >= 150 && lastT - firstT <= 340,
  'B1 收起走动画（is-collapsing 存活 ≈220ms，非即时重绘）',
  { firstT, lastT, span: lastT - firstT, lastFrameT, frames: fr.length });
log(distinctWidths >= 5,
  'B2 卡宽真的在逐帧回缩（采到 ≥5 个不同宽度）', widths.slice(0, 8));
log(collapsingFrames.length > 1 && collapsingFrames[collapsingFrames.length - 1].muted === 0
  && collapsingFrames.some((f) => f.sibOp !== null && f.sibOp > 0.05 && f.sibOp < 0.95),
  'B3 同行其余卡片淡入回（is-row-muted 已摘 + 采到中间 opacity）',
  { mutedSeq: [...new Set(collapsingFrames.map((f) => f.muted))], sibOps: [...new Set(collapsingFrames.map((f) => f.sibOp))].slice(0, 6) });
log(optsOps.length >= 3 && baseOps.length >= 3
  && Math.max.apply(null, optsOps) > 0.5 && Math.min.apply(null, optsOps) < 0.5
  && Math.max.apply(null, baseOps) > 0.5 && Math.min.apply(null, baseOps) < 0.5,
  'B4 两层交叉：选项卡 opacity 递减、头像卡面 opacity 递增',
  { optsOps: optsOps.slice(0, 8), baseOps: baseOps.slice(0, 8) });

/* 落定后：DOM 已是收缩态卡（无选项卡、无 is-collapsing）、且「回弹」已播过 */
await sleep(700);
const landed = await page.evaluate((id) => {
  const c = document.querySelector('#comm2StaffSheetRoot [data-staff-card][data-staff-id="' + id + '"]');
  return c ? { cls: c.className, hasOpts: !!c.querySelector('.staff-opt'), panels: c.querySelectorAll('.staff-card__panel').length } : null;
}, sampled.id);
log(landed && !landed.hasOpts && !/is-collapsing/.test(landed.cls) && /is-done/.test(landed.cls),
  'B5 落定后 = 收缩态已选卡（无选项卡 / 无 is-collapsing / is-done）', landed);

const timing = await page.evaluate(() => {
  const ms = getComputedStyle(document.documentElement).getPropertyValue('--sp-collapse').trim();
  return { collapseVar: ms };
});
log(timing.collapseVar === '220ms', 'B6 --sp-collapse = 220ms（JS 与 CSS 同源）', timing);

/* ============ C. 其余收起路径也走动画 ============ */
const collapseByPath = async (label, clickFn) => {
  await goto('staff-pick-sheet');
  await clickFirstCard(); await sleep(760);
  const clickExpr = clickFn;
  const got = await page.evaluate(async (src) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const t0 = performance.now();
    let seen = 0, first = -1, last = -1;
    (new Function(src))();
    for (let i = 0; i < 40; i++) {
      /* 必须查 live DOM：落定会 innerHTML 重建 */
      const c = document.querySelector('#comm2StaffSheetRoot .staff-card.is-collapsing');
      if (c) { seen++; const t = Math.round(performance.now() - t0); if (first < 0) first = t; last = t; }
      if (last > 0 && !c && performance.now() - t0 > last + 60) break;
      await sleep(16);
    }
    return { seen, first, last, span: last - first };
  }, clickExpr);
  log(got.seen > 0 && got.span >= 140 && got.span <= 360,
    'C ' + label + '：同样走收起动画', got);
};
await collapseByPath('点遮罩 scrim', 'document.querySelector("#comm2StaffSheetRoot [data-staff-scrim]").click();');
await collapseByPath('点编辑卡自身空白', 'document.querySelector("#comm2StaffSheetRoot .staff-card.is-editing .staff-card__panel[data-face=\\"opts\\"]").click();');
await collapseByPath('点另一张员工卡（先收再展）',
  'const hits=[...document.querySelectorAll("#comm2StaffSheetRoot [data-staff-card-hit]")]; hits[1] && hits[1].click();');

await browser.close();
console.log(fails ? '\nFAILED ' + fails : '\nALL PASS');
process.exit(fails ? 1 : 0);
