/* 临时 UI 校验（跑完即删）：设置 Sheet 参数卡 + 选人四态 */
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const skillRoot = process.env.SKILL_DIR || 'C:\\Users\\Administrator\\.cursor\\skills\\run-to-figma';
let puppeteer;
try {
  puppeteer = await import('puppeteer-core');
} catch {
  const req = createRequire(join(skillRoot, 'scripts', '_resolve.js'));
  const entry = req.resolve('puppeteer-core');
  puppeteer = await import('file:///' + entry.replaceAll('\\', '/').replace(/^\/([A-Za-z]):/, '$1:'));
}

const browserPath = [
  process.env.FIGMA_CAPTURE_BROWSER,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => p && existsSync(p));
if (!browserPath) { console.error('no browser'); process.exit(1); }

const FILE = 'file:///D:/RTB%E6%89%93%E8%A1%A5%E4%B8%81%E5%B7%A5%E7%A8%8B/%E6%8F%90%E6%88%90%E8%AE%BE%E7%BD%AE/index.html';
const browser = await puppeteer.launch({ executablePath: browserPath, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });

let fails = 0;
const log = (ok, name, extra) => {
  if (!ok) fails++;
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (extra !== undefined ? ' | ' + JSON.stringify(extra) : ''));
};
const near = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;

async function open(capture) {
  await page.goto(FILE + '?view=desktop&capture=' + capture, { waitUntil: 'load', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1800));
}

/* ---------- A. 规则设置 Sheet 参数区 ---------- */
await open('comm2-cat-sheet');
let A = await page.evaluate(() => {
  const body = document.querySelector('#comm2CatSheetBody');
  const caps = [...body.querySelectorAll('.comm2-sheet-station-grid .comm2-cap')];
  const extraStation = body.querySelector('.comm2-sheet-station.is-extra');
  const r = (el) => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, right: b.right, bottom: b.bottom }; };
  return {
    stationLabels: [...body.querySelectorAll('.comm2-sheet-station-grid .comm2-sheet-station__label')].map((e) => e.textContent.trim()),
    stationLabelSize: body.querySelector('.comm2-sheet-station-grid .comm2-sheet-station__label')
      ? getComputedStyle(body.querySelector('.comm2-sheet-station-grid .comm2-sheet-station__name')).fontSize : '',
    editIcon: body.querySelector('.comm2-sheet-station-grid .comm2-sheet-station__edit svg')
      ? body.querySelector('.comm2-sheet-station-grid .comm2-sheet-station__edit svg').getBoundingClientRect().width : 0,
    capTitles: caps.map((c) => c.querySelector('.comm2-cap__title').textContent.trim()),
    capTitleColor: caps[0] ? getComputedStyle(caps[0].querySelector('.comm2-cap__title')).color : '',
    capTitleSize: caps[0] ? getComputedStyle(caps[0].querySelector('.comm2-cap__title')).fontSize : '',
    capRects: caps.map(r),
    segCount: caps.filter((c) => c.querySelector('.comm2-cap__seg')).length,
    segItems: caps[0] ? [...caps[0].querySelectorAll('.comm2-cap__seg-item')].map((e) => e.textContent.trim()) : [],
    segOn: caps[0] ? (caps[0].querySelector('.comm2-cap__seg-item.is-on') || {}).textContent : '',
    segRect: caps[0] ? r(caps[0].querySelector('.comm2-cap__seg')) : null,
    fieldRect: caps[0] ? r(caps[0].querySelector('.comm2-cap__field')) : null,
    extraLabel: extraStation ? extraStation.querySelector('.comm2-sheet-station__label').textContent.trim() : '',
    extraTitle: extraStation && extraStation.querySelector('.comm2-cap__title') ? extraStation.querySelector('.comm2-cap__title').textContent.trim() : '',
    extraStationRect: extraStation ? r(extraStation) : null,
    extraCapRect: extraStation && extraStation.querySelector('.comm2-cap') ? r(extraStation.querySelector('.comm2-cap')) : null,
    hasClose: !!(extraStation && extraStation.querySelector('.comm2-extra-close')),
    dashed: [...body.querySelectorAll('.comm2-extra-add')].map((e) => e.textContent.trim()),
    oldChip: body.querySelectorAll('.comm2-cap__mode, .comm2-cap__head-acts').length,
    hint: (body.querySelector('.comm2-sheet-params-hint') || {}).textContent || ''
  };
});
log(A.stationLabels.join('/') === '大工/中工/小工', 'A1 三工位横排一行', A.stationLabels);
log(A.stationLabelSize === '13px', 'A2 工位名字号=卡内标题 13px', A.stationLabelSize);
log(near(A.editIcon, 16), 'A3 改名图标 16px', A.editIcon);
log(A.capTitles.join('/') === '提成/提成/提成', 'A4 各工位仅一张「提成」卡', A.capTitles);
log(A.capTitleColor === 'rgb(146, 146, 146)', 'A5 卡内标题字色 #929292', A.capTitleColor);
log(A.segCount === 3 && A.segItems.join('/') === '比例/金额' && A.segOn === '比例', 'A6 两段式胶囊（比例/金额）', [A.segCount, A.segItems, A.segOn]);
log(near(A.capRects[0].y, A.capRects[2].y) && A.capRects[0].x < A.capRects[1].x && A.capRects[1].x < A.capRects[2].x, 'A7 三卡同一行', A.capRects.map((c) => [Math.round(c.x), Math.round(c.y)]));
log(A.segRect.right <= A.capRects[0].right - 6 && A.segRect.bottom <= A.capRects[0].bottom - 4
  && A.segRect.y >= A.fieldRect.bottom - 2 && near(A.segRect.w, 70, 3)
  && A.capRects[0].right - A.segRect.right <= 14,
  'A8 窄卡：胶囊换到第 2 行、右对齐贴卡片右下角、保持原始尺寸、不溢出卡片', { field: A.fieldRect, seg: A.segRect, cap: A.capRects[0] });
log(A.extraLabel === '顾客指定', 'A9 第二行标签「顾客指定」', A.extraLabel);
log(A.extraTitle === '指定', 'A10 第二行卡内标题「指定」（原「额外」）', A.extraTitle);
log(near(A.extraCapRect.w, A.capRects[0].w, 2) && near(A.extraCapRect.x, A.capRects[0].x, 2), 'A11 顾客指定卡宽=单工位卡、左对齐', [A.extraCapRect, A.capRects[0]]);
log(A.extraCapRect.y > A.capRects[0].bottom, 'A12 顾客指定在工位行下一行', [A.extraCapRect.y, A.capRects[0].bottom]);
log(A.hasClose && A.oldChip === 0, 'A13 「指定」卡带关闭× 且无旧 chip', [A.hasClose, A.oldChip]);

/* A16～A19：不分工位 → 两行居左（「提成」行 / 「顾客指定」行），卡宽 175px 不变、位置与按工位左对齐 */
const openCat = async () => { await open('comm2-cat-sheet'); };
const avgSnap = () => page.evaluate(() => {
  const body = document.querySelector('#comm2CatSheetBody');
  const r = (el) => { const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), bottom: Math.round(b.bottom), right: Math.round(b.right) }; };
  const rows = body.querySelector('.comm2-sheet-avg-rows');
  const info = (root) => root ? [...root.children].map((c) => ({
    label: (c.querySelector('.comm2-sheet-station__label') || {}).textContent,
    row: r(c),
    cap: r(c.querySelector('.comm2-cap') || c.querySelector('.comm2-extra-add')),
    title: c.querySelector('.comm2-cap__title') ? c.querySelector('.comm2-cap__title').textContent.trim() : '',
    dot: c.querySelector('.comm2-sheet-station__dot') ? getComputedStyle(c.querySelector('.comm2-sheet-station__dot')).backgroundColor : '',
    dashed: !!c.querySelector('.comm2-extra-add'),
    dashedTxt: c.querySelector('.comm2-extra-add__txt') ? c.querySelector('.comm2-extra-add__txt').textContent : '',
    editable: !!c.querySelector('[data-comm2-station-inline-edit]')
  })) : [];
  return {
    bodyH: Math.round(body.getBoundingClientRect().height),
    rows: info(rows),
    stationRowX: (() => { const g = body.querySelector('.comm2-sheet-station-grid .comm2-sheet-station'); return g ? Math.round(g.getBoundingClientRect().x) : -1; })(),
    stationBodyH: Math.round(body.getBoundingClientRect().height)
  };
});
const pickMode = (m) => page.evaluate((mode) => { const b = document.querySelector('#comm2CatSheetBody [data-comm2-sheet-pick="' + mode + '"]'); if (b) b.click(); }, m);

const st0 = await avgSnap();
const stH = st0.bodyH, stX = st0.stationRowX;
await pickMode('avg');
await new Promise((r) => setTimeout(r, 450));
let A16 = await avgSnap();
log(A16.rows.length === 2 && A16.rows[0].label === '提成' && A16.rows[1].label === '顾客指定',
  'A16 不分工位 → 两行居左：「提成」行 + 「顾客指定」行', A16.rows.map((r) => r.label));
log(A16.rows.every((r) => r.row.w === A16.rows[0].row.w) && A16.rows[0].row.w < 200 && A16.rows[0].cap.w >= 170,
  'A17 行宽 = 半宽「宽卡」（175px，尺寸不变）', A16.rows.map((r) => [r.row.w, r.cap.w]));
log(A16.rows[0].row.x === stX && A16.rows[0].row.x === A16.rows[1].row.x,
  'A18 两行左对齐、左边缘与「按工位」的工位卡一致（不出现大幅窗口抖动）',
  { avgX: [A16.rows[0].row.x, A16.rows[1].row.x], stationX: stX, bodyH: { station: stH, avg: A16.bodyH, delta: A16.bodyH - stH } });
log(A16.rows[0].title === '提成' && A16.rows[1].title === '指定' && A16.rows.every((r) => r.editable === false),
  'A19 行标签静态不可改名；卡内标题「提成」「指定」', [A16.rows[0].title, A16.rows[1].title]);

/* A20：不分工位 + 未开顾客指定 → 同为两行居左（提成行 + 顾客指定虚线卡行），虚线卡等高 66px */
await page.evaluate(() => { const b = document.querySelector('#comm2CatSheetBody [data-comm2-extra="off"]'); if (b) b.click(); });
await new Promise((r) => setTimeout(r, 450));
let A20 = await avgSnap();
log(A20.rows.length === 2 && A20.rows[0].dashed === false && A20.rows[1].dashed === true
  && A20.rows[1].dashedTxt === '+ 顾客指定提成' && A20.rows[0].cap.h === A20.rows[1].cap.h
  && A20.rows[0].row.x === A20.rows[1].row.x,
  'A20 未开顾客指定 → 仍两行居左（提成卡 + 虚线卡等高、左对齐）',
  A20.rows.map((r) => [r.label, r.dashed, r.dashedTxt, r.cap.h, r.cap.w]));

await openCat();

/* A14：点胶囊整块 → 切换 金额；A15：胶囊固定不动、不溢出卡片、金额输入框可容纳数值 */
let flip = await page.evaluate(() => {
  const cap = document.querySelector('#comm2CatSheetBody .comm2-sheet-station-grid .comm2-cap');
  window.__segBefore = (() => { const b = cap.querySelector('.comm2-cap__seg').getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y) }; })();
  window.__segWBefore = Math.round(cap.querySelector('.comm2-cap__seg').getBoundingClientRect().width);
  const card = cap.getBoundingClientRect();
  window.__cardBefore = { right: Math.round(card.right), bottom: Math.round(card.bottom) };
  cap.querySelector('.comm2-cap__seg').click();
  return true;
});
await new Promise((r) => setTimeout(r, 350));
let A14 = await page.evaluate(() => {
  const cap = document.querySelector('#comm2CatSheetBody .comm2-sheet-station-grid .comm2-cap');
  const seg = cap.querySelector('.comm2-cap__seg');
  const sr = seg.getBoundingClientRect();
  const cr = cap.getBoundingClientRect();
  const inp = cap.querySelector('input');
  return {
    on: (cap.querySelector('.comm2-cap__seg-item.is-on') || {}).textContent,
    unit: cap.querySelector('.comm2-cap__unit') ? cap.querySelector('.comm2-cap__unit').textContent : '',
    val: inp.value,
    seg: { x: Math.round(sr.x), y: Math.round(sr.y) },
    overflowR: Math.round(sr.right - cr.right),
    overflowB: Math.round(sr.bottom - cr.bottom),
    inputW: Math.round(inp.getBoundingClientRect().width),
    fieldW: Math.round(cap.querySelector('.comm2-cap__field').getBoundingClientRect().width),
    segW: Math.round(sr.width),
    sameRow: Math.round(Math.abs(cap.querySelector('.comm2-cap__field').getBoundingClientRect().top - sr.top)),
    rowScroll: document.querySelector('#comm2CatSheetBody').scrollWidth - document.querySelector('#comm2CatSheetBody').clientWidth
  };
});
log(A14.on === '金额' && A14.unit === '¥', 'A14 点整块胶囊切换为金额（值清空为 0 保持既有值）', A14);
log(flip && A14.seg.x === (await page.evaluate(() => window.__segBefore.x)) && A14.seg.y === (await page.evaluate(() => window.__segBefore.y))
  && A14.overflowR <= -6 && A14.overflowB <= -4 && A14.inputW > 0 && A14.rowScroll <= 0,
  'A15 切换后胶囊原地不动（不消失、不溢出卡片）', A14);
log(A14.segW >= 66 && A14.segW <= 74 && A14.segW === (await page.evaluate(() => window.__segWBefore)),
  'A15b 窄卡胶囊换行后**保持原始尺寸**（不被压缩）', [A14.segW, await page.evaluate(() => window.__segWBefore)]);

/* A15c：金额态输入 6 位长数值，胶囊仍不溢出卡片（值只在自己框内裁切） */
let A15c = await page.evaluate(() => {
  const cap = document.querySelector('#comm2CatSheetBody .comm2-sheet-station-grid .comm2-cap');
  const inp = cap.querySelector('input');
  inp.focus(); inp.value = '1234.56';
  inp.dispatchEvent(new Event('input', { bubbles: true }));
  const seg = cap.querySelector('.comm2-cap__seg').getBoundingClientRect();
  const cr = cap.getBoundingClientRect();
  return {
    segX: Math.round(seg.x),
    segW: Math.round(seg.width),
    overflowR: Math.round(seg.right - cr.right),
    overflowB: Math.round(seg.bottom - cr.bottom),
    fieldScroll: (() => { const f = cap.querySelector('.comm2-cap__field'); return f.scrollWidth - f.clientWidth; })(),
    bodyScroll: document.querySelector('#comm2CatSheetBody').scrollWidth - document.querySelector('#comm2CatSheetBody').clientWidth
  };
});
log(A15c.segX === (await page.evaluate(() => window.__segBefore.x)) && A15c.segW >= 66 && A15c.overflowR <= -6 && A15c.bodyScroll <= 0,
  'A15c 金额输入 6 位长数值，胶囊原地不动、尺寸不变、不溢出卡片', A15c);

/* ---------- B. 关闭顾客指定（按工位） → 「顾客指定」行虚线卡 ---------- */
await open('comm2-cat-sheet-noguest');
let B = await page.evaluate(() => {
  const body = document.querySelector('#comm2CatSheetBody');
  const add = body.querySelector('.comm2-sheet-station.is-extra .comm2-extra-add');
  const st = document.querySelector('#comm2EditCards [data-comm2-card="default:labor"]');
  return {
    dashed: add ? add.textContent.trim() : '',
    extraCard: body.querySelectorAll('.comm2-cap--extra').length,
    dashedW: add ? Math.round(add.getBoundingClientRect().width) : 0,
    dashedH: add ? Math.round(add.getBoundingClientRect().height) : 0,
    cellW: Math.round(body.querySelector('.comm2-sheet-station-grid .comm2-cap').getBoundingClientRect().width),
    rowLabel: (body.querySelector('.comm2-sheet-station.is-extra .comm2-sheet-station__label') || {}).textContent || '',
    cardSummary: st ? st.textContent.replace(/\s+/g, ' ').trim() : ''
  };
});
log(B.dashed === '+ 顾客指定提成' && B.extraCard === 0, 'B1 未开顾客指定 → 虚线卡「+ 顾客指定提成」', [B.dashed, B.extraCard]);
log(near(B.dashedW, B.cellW, 2) && B.rowLabel === '顾客指定', 'B2 虚线卡宽度=单工位卡（宽同 1/3 列）', [B.dashedW, B.cellW]);

/* ---------- C. 编辑页规则卡摘要：「顾客指定」段（额外值叠加） ---------- */
await open('comm2-edit');
let C = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('#comm2EditCards .comm2-rule-bar')];
  const all = cards.map((c) => c.textContent.replace(/\s+/g, ' ').trim());
  const segs = [...document.querySelectorAll('#comm2EditCards .comm2-rule-bar__param-seg')];
  const extraSeg = segs.filter((s) => /^顾客指定/.test(s.textContent.replace(/\s+/g, ' ').trim()) && s.querySelector('.comm2-rule-bar__p-lbl'));
  return {
    all,
    stationCard: all.filter((t) => /大工12%/.test(t))[0] || '',
    extraCount: extraSeg.length,
    extraText: extraSeg.length ? extraSeg[0].textContent.replace(/\s+/g, ' ').trim() : '',
    extraOnCard: all.filter((t) => /顾客指定\+3%/.test(t)).length,
    legacy: /点客/.test(document.body.innerText),
    extraWordOnCard: all.filter((t) => /额外/.test(t)).length
  };
});
log(/大工12%/.test(C.stationCard) && /顾客指定\+5%/.test(C.stationCard), 'C1 按工位卡摘要：大工12% + 顾客指定+5% 同列', C.stationCard);
log(C.extraOnCard >= 2 && C.extraCount >= 6, 'C2 顾客指定作为独立参数项叠加展示（平均/覆盖卡均有）', [C.extraCount, C.extraOnCard]);
log(C.legacy === false, 'C3 界面无「点客」旧词', C.legacy);
log(C.extraWordOnCard === 0, 'C4 规则卡上不再出现「额外」字样（改称「顾客指定」）', C.extraWordOnCard);

/* ---------- D. 选人：整行展开 4 张勾选卡 ---------- */
await open('staff-pick-edit');
let D = await page.evaluate(() => {
  const root = document.querySelector('#comm2StaffSheetRoot');
  const opts = [...root.querySelectorAll('.staff-opt')];
  const grid = root.querySelector('.staff-grid');
  const editing = root.querySelector('.staff-card.is-editing');
  const gb = grid.getBoundingClientRect();
  const eb = editing ? editing.getBoundingClientRect() : null;
  return {
    labels: opts.map((o) => o.querySelector('.staff-opt__txt').textContent.trim()),
    boxes: opts.filter((o) => o.querySelector('.staff-opt__box')).length,
    checked: opts.filter((o) => o.classList.contains('is-on')).length,
    rowTop: new Set(opts.map((o) => Math.round(o.getBoundingClientRect().y))).size,
    gridW: Math.round(gb.width),
    editW: eb ? Math.round(eb.width) : 0,
    editX: eb ? Math.round(eb.x) : 0,
    gridX: Math.round(gb.x),
    boxPos: opts.length ? (() => { const b = opts[0].getBoundingClientRect(); const bx = opts[0].querySelector('.staff-opt__box').getBoundingClientRect(); return { right: Math.round(b.right - bx.right), top: Math.round(bx.top - b.top) }; })() : null,
    hint: (document.querySelector('#comm2StaffSheetHint') || {}).textContent || '',
    clearBtns: root.querySelectorAll('.staff-card__clear').length
  };
});
log(D.labels.join('/') === '大工/中工/小工/顾客指定', 'D1 展开为 4 张卡（大工/中工/小工/顾客指定）', D.labels);
log(D.boxes === 4 && D.checked === 0, 'D2 每卡右上角一个未勾选控件', [D.boxes, D.checked]);
log(D.rowTop === 1, 'D3 4 张卡同一行', D.rowTop);
log(near(D.editW, D.gridW, 3) && near(D.editX, D.gridX, 3), 'D4 展开占满整行', [D.editW, D.gridW]);
log(D.boxPos && D.boxPos.right <= 8 && D.boxPos.top <= 8, 'D5 勾选控件在卡片右上角', D.boxPos);
log(D.clearBtns === 0, 'D6 无右上角 ×', D.clearBtns);
log(D.hint.indexOf('顾客指定') >= 0 && D.hint.indexOf('工位可多选') >= 0 && D.hint.indexOf('单独分配') >= 0, 'D7 hint 说明多选/叠加/单独分配', D.hint);

/* D8：点「大工」→ 勾选并收缩，摘要「大工」 */
await page.evaluate(() => document.querySelector('#comm2StaffSheetRoot .staff-opt[data-staff-opt="senior"]').click());
await new Promise((r) => setTimeout(r, 900));
let D8 = await page.evaluate(() => {
  const root = document.querySelector('#comm2StaffSheetRoot');
  const card = root.querySelector('.staff-card.is-done');
  return {
    opts: root.querySelectorAll('.staff-opt').length,
    summary: card ? card.textContent.replace(/\s+/g, ' ').trim() : '',
    tick: root.querySelectorAll('.staff-card__tick, [data-staff-tick]').length,
    panels: card ? card.querySelectorAll('.staff-card__panel').length : 0
  };
});
log(D8.opts === 0 && /大工/.test(D8.summary), 'D8 点选项 → 勾选并收缩为员工卡（摘要「大工」）', D8.summary);
log(D8.tick === 0 && D8.panels === 1, 'D9 收缩态员工卡**不再有**勾选控件（十九次废止），只剩一个卡面', D8);

/* D10：再点员工卡 → 再展开，点「顾客指定」→ 叠加勾选 */
await page.evaluate(() => document.querySelector('#comm2StaffSheetRoot .staff-card.is-done .staff-card__panel').click());
await new Promise((r) => setTimeout(r, 800));
let D10a = await page.evaluate(() => {
  const root = document.querySelector('#comm2StaffSheetRoot');
  const opts = [...root.querySelectorAll('.staff-opt')];
  return { labels: opts.map((o) => o.querySelector('.staff-opt__txt').textContent.trim()), on: opts.filter((o) => o.classList.contains('is-on')).map((o) => o.querySelector('.staff-opt__txt').textContent.trim()) };
});
log(D10a.on.join('/') === '大工', 'D10 再展开时工位为已勾选态', D10a);
await page.evaluate(() => document.querySelector('#comm2StaffSheetRoot .staff-opt[data-staff-opt="extra"]').click());
await new Promise((r) => setTimeout(r, 700));
let D10 = await page.evaluate(() => {
  const card = document.querySelector('#comm2StaffSheetRoot .staff-card.is-done');
  return card ? card.textContent.replace(/\s+/g, ' ').trim() : '';
});
log(/大工\s*·\s*顾客指定/.test(D10), 'D11 工位 + 顾客指定 同时勾选（摘要「大工 · 顾客指定」）', D10);

/* D12：工位**多选追加** —— 展开后再点「中工」，大工「保持勾选」并追加中工、顾客指定仍在
   （二十五次：废止「单选替换」；旧勾不取消，只画新勾） */
await page.evaluate(() => document.querySelector('#comm2StaffSheetRoot .staff-card.is-done .staff-card__panel').click());
await new Promise((r) => setTimeout(r, 700));
await page.evaluate(() => document.querySelector('#comm2StaffSheetRoot .staff-opt[data-staff-opt="mid"]').click());
await new Promise((r) => setTimeout(r, 700));
let D12 = await page.evaluate(() => {
  const card = document.querySelector('#comm2StaffSheetRoot .staff-card.is-done');
  return card ? card.textContent.replace(/\s+/g, ' ').trim() : '';
});
log(/大工\s*·\s*中工/.test(D12) && /顾客指定/.test(D12), 'D12 工位多选追加（大工 · 中工 · 顾客指定，旧勾保留）', D12);

/* D13：展开 → **逐个点掉**全部已勾选项（大工 / 中工 / 顾客指定）→ 完全取消该员工
   （收缩态卡上已无勾选控件，取消只能走「再点该卡 → 点掉勾」这条路径） */
await page.evaluate(() => document.querySelector('#comm2StaffSheetRoot .staff-card.is-done .staff-card__panel').click());
await new Promise((r) => setTimeout(r, 800));
await page.evaluate(() => document.querySelector('#comm2StaffSheetRoot .staff-opt[data-staff-opt="senior"]').click());
await new Promise((r) => setTimeout(r, 900));
await page.evaluate(() => document.querySelector('#comm2StaffSheetRoot .staff-card.is-done .staff-card__panel').click());
await new Promise((r) => setTimeout(r, 800));
await page.evaluate(() => document.querySelector('#comm2StaffSheetRoot .staff-opt[data-staff-opt="mid"]').click());
await new Promise((r) => setTimeout(r, 900));
await page.evaluate(() => document.querySelector('#comm2StaffSheetRoot .staff-card.is-done .staff-card__panel').click());
await new Promise((r) => setTimeout(r, 800));
await page.evaluate(() => document.querySelector('#comm2StaffSheetRoot .staff-opt[data-staff-opt="extra"]').click());
await new Promise((r) => setTimeout(r, 900));
let D13 = await page.evaluate(() => {
  const root = document.querySelector('#comm2StaffSheetRoot');
  return {
    done: root.querySelectorAll('.staff-card.is-done').length,
    ticks: root.querySelectorAll('.staff-card__tick, [data-staff-tick]').length,
    expanded: root.querySelectorAll('.staff-opt').length,
    entry: (document.querySelector('#comm2SpBlock') || {}).textContent || ''
  };
});
log(D13.done === 0 && /未选择/.test(D13.entry), 'D13 逐个点掉全部已勾选项 → 完全取消该员工', D13.entry.replace(/\s+/g, ' ').trim());

/* ---------- E. 不分工位 + 顾客指定 → 提成 / 顾客指定（可叠加） ---------- */
await open('staff-pick-avg');
await page.evaluate(() => document.querySelector('#comm2StaffSheetRoot [data-staff-card-hit]').click());
await new Promise((r) => setTimeout(r, 800));
let E = await page.evaluate(() => [...document.querySelectorAll('#comm2StaffSheetRoot .staff-opt__txt')].map((e) => e.textContent.trim()));
log(E.join('/') === '服务提成/顾客指定', 'E1 不分工位+开顾客指定 → 服务提成/顾客指定（十九次改名）', E);

/* ---------- F. 态4：不分工位、未开顾客指定 → 点选即勾选 ---------- */
await open('staff-pick-direct');
await page.evaluate(() => document.querySelector('#comm2StaffSheetRoot [data-staff-card-hit]').click());
await new Promise((r) => setTimeout(r, 500));
let F = await page.evaluate(() => {
  const root = document.querySelector('#comm2StaffSheetRoot');
  return { opts: root.querySelectorAll('.staff-opt').length, done: root.querySelectorAll('.staff-card.is-done').length };
});
log(F.opts === 0 && F.done === 1, 'F1 态4 点选即勾选（无展开）', F);

/* ---------- G. 按工位 + 未开顾客指定 → 3 按钮 ---------- */
await open('staff-pick');
await page.evaluate(() => {
  document.querySelector('[data-comm2-sp-extra="0"]').click();
});
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => document.querySelector('#comm2SpBlock [data-open-comm2-sp-staff]').click());
await new Promise((r) => setTimeout(r, 600));
await page.evaluate(() => document.querySelector('#comm2StaffSheetRoot [data-staff-card-hit]').click());
await new Promise((r) => setTimeout(r, 800));
let G = await page.evaluate(() => [...document.querySelectorAll('#comm2StaffSheetRoot .staff-opt__txt')].map((e) => e.textContent.trim()));
log(G.join('/') === '大工/中工/小工', 'G1 按工位+未开顾客指定 → 3 按钮', G);

/* ---------- H. 反向（取消）动效提速一倍：时长恒为正向一半 + JS 门控同源 ---------- */
await open('staff-pick-avg');
await page.evaluate(() => document.querySelector('#comm2StaffSheetRoot [data-staff-card-hit]').click());
await new Promise((r) => setTimeout(r, 800));

/* H1：变量存在且恒为正向的 1/2 */
let H1 = await page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  const g = (n) => String(cs.getPropertyValue(n) || '').trim();
  const ms = (s) => parseFloat(s) || 0;
  const rd = ms(g('--sp-check-red')), dd = ms(g('--sp-check-draw'));
  const ru = ms(g('--sp-uncheck-red')), du = ms(g('--sp-uncheck-draw'));
  return { rd, dd, ru, du, rev: ru + du, fwd: rd + dd };
});
log(H1.du === H1.dd / 2 && H1.ru === H1.rd / 2 && H1.rev === H1.fwd / 2,
  'H1 --sp-uncheck-* 恰为 --sp-check-* 的一半（85ms / 170ms）', H1);

/* H2：反向单轮实际样式 = 收勾 55ms（delay 0，linear）+ 褪红 30ms（delay 55ms） */
const clickOpt = (k) => page.evaluate((key) => {
  const b = document.querySelector('#comm2StaffSheetRoot .staff-opt[data-staff-opt="' + key + '"]');
  if (!b) return false; b.click(); return true;
}, k);
const boxSnapshot = (k) => page.evaluate(async (key) => {
  await new Promise((res) => requestAnimationFrame(res));
  const btn = document.querySelector('#comm2StaffSheetRoot .staff-opt[data-staff-opt="' + key + '"]');
  const box = btn && btn.querySelector('.staff-opt__box');
  if (!box) return null;
  const path = box.querySelector('svg path');
  const a = (path.getAnimations() || [])[0];
  const cs = getComputedStyle(box);
  const first = (s) => parseFloat(String(s).split(',')[0]) * 1000;
  return {
    cls: box.className,
    name: a ? a.animationName : '',
    dur: a ? a.effect.getComputedTiming().duration : 0,
    delay: a ? a.effect.getComputedTiming().delay : 0,
    boxDur: first(cs.transitionDuration), boxDelay: first(cs.transitionDelay)
  };
}, k);
/* 量两段时刻（十九次起「收起」是一条独立动画，必须分开量）：
     checkEnd = `.staff-card.is-collapsing` 首帧 = 勾选动效结束 / 收起动画起点
     settle   = `.staff-card.is-expanding` 消失 = 重绘落定（收起动画播完） */
const stagesMs = () => page.evaluate(() => new Promise((res) => {
  const root = document.querySelector('#comm2StaffSheetRoot');
  const t0 = performance.now();
  let checkEnd = -1;
  const iv = setInterval(() => {
    const t = Math.round(performance.now() - t0);
    if (checkEnd < 0 && root.querySelector('.staff-card.is-collapsing')) checkEnd = t;
    if (!root.querySelector('.staff-card.is-expanding')) { clearInterval(iv); res({ checkEnd: checkEnd < 0 ? t : checkEnd, settle: t }); }
    else if (t > 6000) { clearInterval(iv); res({ checkEnd, settle: -1 }); }
  }, 5);
}));

/* 正向先勾选「顾客指定」→ 落定；再展开 → 点它取消（反向） */
await clickOpt('extra');
await new Promise((r) => setTimeout(r, 800));
await page.evaluate(() => document.querySelector('#comm2StaffSheetRoot [data-staff-card-hit]').click());
await new Promise((r) => setTimeout(r, 800));
let H2t = stagesMs();
await clickOpt('extra');
let H2 = await boxSnapshot('extra');
let H2s = await H2t;
log(H2.name === 'spCheckUndraw' && H2.dur === H1.du && H2.delay === 0 && H2.boxDur === H1.ru && H2.boxDelay === H1.du,
  'H2 反向实际样式：收勾 = --sp-uncheck-draw（delay 0）、褪红 = --sp-uncheck-red（delay = 收勾时长）', H2);
log(H2s.checkEnd >= H1.rev && H2s.checkEnd <= H1.rev + 60,
  'H3 反向勾选动效结束（= 收起动画起点）≈ 85ms（不再等 170ms）', H2s);
log(H2s.settle >= H2s.checkEnd + 180 && H2s.settle <= H2s.checkEnd + 320,
  'H3b 收起动画（A2 · --sp-collapse 220ms）播完才重绘落定', H2s);

/* H4：同源 —— 把 --sp-uncheck-draw 拉到 600ms，勾选动效结束必须随之推到 ≈630ms
   注意顺序：必须**先展开 → 勾选（正向，把「顾客指定」勾上）→ 再展开 → 取消（反向，量落定）**，
   否则第二次点的是「未勾选 → 勾选」，走的是正向路径 */
await page.evaluate(() => document.documentElement.style.setProperty('--sp-uncheck-draw', '600ms'));
await new Promise((r) => setTimeout(r, 500));
await page.evaluate(() => document.querySelector('#comm2StaffSheetRoot [data-staff-card-hit]').click());
await new Promise((r) => setTimeout(r, 800));
await clickOpt('extra');                       /* 正向勾选（600ms 只作用于反向，此处仍 170ms） */
await new Promise((r) => setTimeout(r, 900));
await page.evaluate(() => document.querySelector('#comm2StaffSheetRoot [data-staff-card-hit]').click());
await new Promise((r) => setTimeout(r, 800));
let H4 = await page.evaluate(() => !!document.querySelector('#comm2StaffSheetRoot .staff-opt[data-staff-opt="extra"].is-on'));
let H4t = stagesMs();
await clickOpt('extra');                       /* 反向取消 → 应等 600 + 30 = 630ms 才结束勾选动效 */
let H4s = await H4t;
await page.evaluate(() => document.documentElement.style.removeProperty('--sp-uncheck-draw'));
log(H4 && H4s.checkEnd >= 630 && H4s.checkEnd <= 780,
  'H4 门控同源：--sp-uncheck-draw 600ms → 勾选动效结束随之 ≈630ms', H4s);

/* ---------- I. 加选工位（A8 · 二十五次：废止「并行红色交接」，改「只画新勾、旧勾保留」） ---------- */
const openSpSheet = async () => {
  await page.evaluate(() => { const b = document.querySelector('#comm2SpBlock [data-open-comm2-sp-staff]'); if (b) b.click(); });
  await new Promise((r) => setTimeout(r, 700));
};
const pickStaff = async (id) => {
  await page.evaluate((i) => document.querySelector('#comm2StaffSheetRoot [data-staff-card-hit][data-staff-id="' + i + '"]').click(), id);
  await new Promise((r) => setTimeout(r, 820));
};

await open('staff-pick');
await openSpSheet();
const iSid = await page.evaluate(() => { const h = document.querySelector('#comm2StaffSheetRoot [data-staff-card-hit]'); return h ? h.dataset.staffId : ''; });
log(!!iSid, 'I0 取到员工 id', iSid);
await pickStaff(iSid);
await page.evaluate((i) => document.querySelector('#comm2StaffSheetRoot .staff-opt[data-staff-opt="senior"][data-staff-id="' + i + '"]').click(), iSid);
await new Promise((r) => setTimeout(r, 900));
await pickStaff(iSid);                       /* 重新展开，准备换工位 */

let I = await page.evaluate(async (id) => {
  const root = document.querySelector('#comm2StaffSheetRoot');
  const prev = root.querySelector('.staff-opt[data-staff-opt="senior"][data-staff-id="' + id + '"]');
  const next = root.querySelector('.staff-opt[data-staff-opt="mid"][data-staff-id="' + id + '"]');
  const boxOf = (el) => (el ? el.querySelector('.staff-opt__box') : null);
  const bgOf = (el) => { const b = boxOf(el); return b ? getComputedStyle(b).backgroundColor : ''; };
  let tNextRed = -1, tCollapse = -1, tSettle = -1;
  let prevUndraw = false, prevSeen = 0, prevRed = 0, prevBgAtCollapse = '';
  const prevBgStart = bgOf(prev);
  const t0 = performance.now();
  next.click();
  return await new Promise((res) => {
    const iv = setInterval(() => {
      const t = Math.round(performance.now() - t0);
      if (prev && prev.isConnected) {
        prevSeen++;
        if (bgOf(prev) === 'rgb(243, 47, 65)') prevRed++;
        if (prev.classList.contains('is-undraw')) prevUndraw = true;
        if (tCollapse >= 0) prevBgAtCollapse = bgOf(prev);
      }
      const nb = boxOf(next);
      if (tNextRed < 0 && nb && getComputedStyle(nb).backgroundColor === 'rgb(243, 47, 65)') tNextRed = t;
      if (tCollapse < 0 && root.querySelector('.staff-card.is-collapsing')) tCollapse = t;
      if (tSettle < 0 && tCollapse >= 0 && !root.querySelector('.staff-card.is-expanding')) tSettle = t;
      if (t > 700 || (tSettle >= 0 && tNextRed >= 0)) {
        clearInterval(iv);
        res({ tNextRed, tCollapse, tSettle, prevUndraw, prevBgStart, prevBgAtCollapse, prevSeen, prevRed });
      }
    }, 10);
  });
}, iSid);
log(I.tNextRed >= 0 && I.tNextRed <= 110, 'I1 加选工位：新勾「立刻」开始画红（≤110ms）', I.tNextRed);
log(I.prevUndraw === false && I.prevSeen > 0 && I.prevRed === I.prevSeen,
  'I2 加选工位：旧勾「全程保持红色」、不走反向收勾（二十五次废止红色交接）', { undraw: I.prevUndraw, red: I.prevRed, seen: I.prevSeen });
log(I.prevBgStart === 'rgb(243, 47, 65)' && I.prevBgAtCollapse === 'rgb(243, 47, 65)',
  'I3 收起开始时旧勾仍为红（本就不褪，无 is-undraw 反超）', { start: I.prevBgStart, atCollapse: I.prevBgAtCollapse });
log(I.tCollapse >= 160 && I.tCollapse <= 250,
  'I4 勾选动效在 ≈170ms 结束（新勾画完才开始收起，旧勾不参与计时）', { tCollapse: I.tCollapse });
log(I.tSettle >= I.tCollapse + 180 && I.tSettle <= I.tCollapse + 320,
  'I4b 收起动画再播 ≈220ms 才落定（A2）', { tCollapse: I.tCollapse, tSettle: I.tSettle });

/* I5：收起动画（A2 · 十九次）—— 点编辑卡自身空白 → 卡宽逐帧回缩 + 两层交叉淡入淡出。
   （原 I5「收缩态点勾取消 → 粉底淡出」路径已随卡上勾一起废止） */
await open('staff-pick');
await openSpSheet();
await pickStaff(iSid);
let I5 = await page.evaluate(async (id) => {
  const liveGrid = () => document.querySelector('#comm2StaffSheetRoot .staff-grid');
  const firstGrid = liveGrid();
  const find = () => {
    const g = liveGrid();
    return g ? g.querySelector(':scope > .staff-card[data-staff-id="' + id + '"]') : null;
  };
  const widths = [];
  const optsOps = [];
  const baseOps = [];
  const c0 = find();
  if (!c0) return { widths, optsOps, baseOps, redrawn: false, ms: 0 };
  c0.querySelector('.staff-card__panel[data-face="opts"]').click();
  return await new Promise((res) => {
    const t0 = performance.now();
    const iv = setInterval(() => {
      const g = liveGrid();
      if (!g || g !== firstGrid) {
        clearInterval(iv);
        res({ widths, optsOps, baseOps, redrawn: true, ms: Math.round(performance.now() - t0) });
        return;
      }
      const c = find();
      if (c) {
        const w = Math.round(c.getBoundingClientRect().width);
        if (widths.indexOf(w) < 0) widths.push(w);
        const o = c.querySelector('.staff-card__opts');
        const b = c.querySelector('.staff-card__panel--base');
        if (o) { const v = +getComputedStyle(o).opacity; if (optsOps.indexOf(v) < 0) optsOps.push(v); }
        if (b) { const v = +getComputedStyle(b).opacity; if (baseOps.indexOf(v) < 0) baseOps.push(v); }
      }
      if (performance.now() - t0 > 1400) { clearInterval(iv); res({ widths, optsOps, baseOps, redrawn: false, ms: 0 }); }
    }, 12);
  });
}, iSid);
log(I5.redrawn && I5.widths.length >= 5 && I5.optsOps.length >= 3 && I5.baseOps.length >= 3,
  'I5 收起动画：卡宽逐帧回缩 + 选项卡淡出 / 头像卡面淡入（两层交叉）', I5);

/* ---------- K. 选人新规则：点任一按钮即收起 / 提成侧与顾客指定侧各自独立可叠加 / 点掉工位 ---------- */
const K = {};
const kOpenSheet = async () => {
  await page.evaluate(() => { const b = document.querySelector('#comm2SpBlock [data-open-comm2-sp-staff]'); if (b) b.click(); });
  await new Promise((r) => setTimeout(r, 650));
};
const kOpenFirst = async () => {
  await page.evaluate(() => { const c = document.querySelector('#comm2StaffSheetRoot [data-staff-card-hit]'); if (c) c.click(); });
  await new Promise((r) => setTimeout(r, 750));
};
const kDone = async () => {
  await page.evaluate(() => { const b = document.querySelector('#comm2StaffSheetDone'); if (b) b.click(); });
  await new Promise((r) => setTimeout(r, 500));
};
const kOpt = (k2) => page.evaluate((key) => { const b = document.querySelector('#comm2StaffSheetRoot [data-staff-opt="' + key + '"]'); if (b) { b.click(); return true; } return false; }, k2);
const kCard = (sid) => page.evaluate((id) => {
  const c = document.querySelector('#comm2StaffSheetRoot [data-staff-card][data-staff-id="' + id + '"]');
  if (!c) return null;
  const pick = c.querySelector('.staff-card__title--pick');
  const miss = c.querySelector('.staff-card__pick-miss');
  const x = c.querySelector('.staff-card__pick-x');
  return {
    cls: c.className,
    /* 十九次：收缩态员工卡**没有**任何勾选控件（`[data-staff-tick]` 已整个删除） */
    tick: !!c.querySelector('[data-staff-tick]'),
    expanded: !!c.querySelector('.staff-opt'),
    pick: pick ? pick.textContent : '',
    missColor: miss ? getComputedStyle(miss).color : '',
    xColor: x ? getComputedStyle(x).color : '',
    on: [...c.querySelectorAll('.staff-opt.is-on')].map((b) => b.getAttribute('data-staff-opt'))
  };
}, sid);
const kEntry = () => page.evaluate(() => ({
  val: (document.querySelector('#comm2SpBlock .detail-staff-entry__val') || {}).textContent,
  rows: [...document.querySelectorAll('#comm2SpBlock .detail-staff-summary__row')].length,
  meta: (document.querySelector('#comm2SpBlock .detail-staff-summary__meta') || {}).textContent || ''
}));

await open('staff-pick-sheet');
const kSid = await page.evaluate(() => { const c = document.querySelector('#comm2StaffSheetRoot [data-staff-card]'); return c ? c.getAttribute('data-staff-id') : ''; });
await kOpenFirst();

/* K1：只点「顾客指定」（没点工位）→ 也必须收起；**计入已选**、有勾选控件、卡片第三行只写「顾客指定」 */
await kOpt('extra');
await new Promise((r) => setTimeout(r, 900));
K.only = await kCard(kSid);
K.onlyOpen = await page.evaluate(() => document.querySelectorAll('#comm2StaffSheetRoot .staff-opt').length);
log(K.onlyOpen === 0, 'K1 展开态只点「顾客指定」也立刻收起（不再保持展开等工位）', K.onlyOpen);
log(/is-done/.test(K.only.cls) && !K.only.tick && !K.only.expanded,
  'K2 只勾顾客指定 = 有效单独分配：选中态样式 + **收缩态不再有勾选控件**', K.only);
log(K.only.pick === '顾客指定' && K.only.xColor === 'rgb(243, 47, 65)' && !K.only.miss,
  'K3 卡片第三行只画红字「顾客指定」（不再前置灰字「无工位」）', K.only);
await kDone();
K.entry1 = await kEntry();
log(K.entry1.val === '已选 1 人' && K.entry1.rows === 1 && K.entry1.meta === '无工位 · 顾客指定',
  'K4 只勾顾客指定**计入已选**（入口「已选 1 人」+ 摘要行仍保留「无工位 · 顾客指定」）', K.entry1);

/* K5：再展开 → 点工位 → 两侧叠加 */
await kOpenSheet(); await kOpenFirst();
K.reopen = await kCard(kSid);
log(K.reopen.on.join('/') === 'extra', 'K5 再展开时「顾客指定」仍为已勾选态、工位未选', K.reopen.on);
await kOpt('senior');
await new Promise((r) => setTimeout(r, 900));
K.chosen = await kCard(kSid);
await kDone();
K.entry2 = await kEntry();
log(!K.chosen.tick && /大工/.test(K.chosen.pick) && K.entry2.val === '已选 1 人' && K.entry2.rows === 1,
  'K6 补选工位 → 工位 + 顾客指定叠加，摘要「大工 · 顾客指定」', [K.chosen, K.entry2]);

/* K7：点掉已勾选工位 → 员工**仍已选**（只发顾客指定提成），摘要回「无工位 · 顾客指定」 */
await kOpenSheet(); await kOpenFirst();
await kOpt('senior');
await new Promise((r) => setTimeout(r, 900));
K.stationOff = await kCard(kSid);
await kDone();
K.entry3 = await kEntry();
log(/is-done/.test(K.stationOff.cls) && !K.stationOff.tick && K.stationOff.pick === '顾客指定'
  && K.entry3.val === '已选 1 人' && K.entry3.meta === '无工位 · 顾客指定',
  'K7 点掉工位 → 仍计入已选，卡片第三行「顾客指定」（入口摘要行保留「无工位 · 顾客指定」）', [K.stationOff, K.entry3]);

/* K8：两侧都点掉（再取消「顾客指定」）→ 完全未选（唯一取消路径） */
await kOpenSheet(); await kOpenFirst();
await kOpt('extra');
await new Promise((r) => setTimeout(r, 900));
K.cleared = await kCard(kSid);
await kDone();
K.entry4 = await kEntry();
log(!/is-done/.test(K.cleared.cls) && !K.cleared.tick && K.cleared.pick === '' && K.entry4.val === '未选择',
  'K8 两侧都空 → 完全取消该员工（粉底与摘要一并撤除）', [K.cleared, K.entry4]);

/* K9：不分工位 + 开顾客指定：只点「顾客指定」→ 计入已选、摘要「顾客指定」 */
await open('staff-pick-avg');
const kSidA = await page.evaluate(() => { const c = document.querySelector('#comm2StaffSheetRoot [data-staff-card]'); return c ? c.getAttribute('data-staff-id') : ''; });
await kOpenFirst();
await kOpt('extra');
await new Promise((r) => setTimeout(r, 900));
K.avg = await kCard(kSidA);
await kDone();
K.entry5 = await kEntry();
log(!K.avg.tick && K.avg.pick === '顾客指定' && K.entry5.val === '已选 1 人',
  'K9 不分工位：只勾「顾客指定」即计入已选（收缩态无勾选控件）', [K.avg, K.entry5]);

/* K10：不分工位：K9 已保留「顾客指定」，再叠加「服务提成」→ **可叠加**，摘要「提成 · 顾客指定」 */
await kOpenSheet(); await kOpenFirst();
K.avgReopen = await kCard(kSidA);
log(K.avgReopen.on.join('/') === 'extra',
  'K10 不分工位：再展开时「顾客指定」仍为已勾选态、「服务提成」未勾（两侧各自独立）', K.avgReopen.on);
await kOpt('avg');
await new Promise((r) => setTimeout(r, 900));
K.avgBoth = await kCard(kSidA);
await kDone();
K.entry6 = await kEntry();
log(!K.avgBoth.tick && K.avgBoth.pick === '提成 · 顾客指定' && K.entry6.val === '已选 1 人',
  'K11 不分工位：服务提成 + 顾客指定可叠加，摘要「提成 · 顾客指定」', [K.avgBoth, K.entry6]);

/* K12：不分工位：点掉「服务提成」→ 仍已选、摘要只余「顾客指定」 */
await kOpenSheet(); await kOpenFirst();
K.avgBothOn = await kCard(kSidA);
await kOpt('avg');
await new Promise((r) => setTimeout(r, 900));
K.avgPlainOff = await kCard(kSidA);
await kDone();
K.entry7 = await kEntry();
log(K.avgBothOn.on.join('/') === 'avg/extra',
  'K12 不分工位：展开时「服务提成」+「顾客指定」同时为勾选态', K.avgBothOn.on);
log(!K.avgPlainOff.tick && K.avgPlainOff.pick === '顾客指定' && K.entry7.val === '已选 1 人',
  'K13 不分工位：点掉「服务提成」→ 仍计入已选，摘要「顾客指定」', [K.avgPlainOff, K.entry7]);

console.log(fails ? ('FAILED ' + fails) : 'ALL PASS');
await browser.close();
process.exit(fails ? 1 : 0);
