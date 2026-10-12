/* 探针：提成方案改动 → 「本期提成怎么算」重算弹窗（PRD §6.13）
   三十一次：取消「本期不动，下期换」→ 两枚按钮即两个结果（竖排、点即生效），开关已删
   A 触发条件 · B 弹窗形态与文案 · C 必须二选一 · D 左按钮 → recalc · E 右按钮 → forward
   F 非金额改动不弹 · G 两种口径的计算差异（calcStaffTrial 直测）· H 未回答就退出的兜底 */
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

let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? '  PASS ' : '  FAIL ') + m); c ? pass++ : fail++; };

const browser = await puppeteer.launch({ executablePath: browserPath, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 880, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.log('  [pageerror]', e.message));

await page.goto(base + '?view=desktop', { waitUntil: 'load', timeout: 30000 });
/* 原型自带的开发者侧栏（.site-nav）在 390px 宽度下会盖住手机画布，导致真实鼠标点击落到导航项上。
   它是演示外壳、不属于产品 UI —— 注入样式隐藏，保证下面的鼠标点击命中弹窗本体。 */
await page.addStyleTag({ content: '.site-nav { display: none !important; }' });
await sleep(1600);

/* 选一个「已分配员工」的方案 */
const target = await page.evaluate(() => {
  const list = window.Comm2Demo.getSchemes();
  const s = list.find((x) => (x.assigneeIds || []).length > 0);
  return s ? { id: s.id, name: s.name, n: s.assigneeIds.length, assignees: s.assigneeIds.slice() } : null;
});
if (!target) { console.log('无已分配员工的方案，探针退出'); await browser.close(); process.exit(1); }

console.log('\n===== A · 触发条件 =====');
ok(!!target, '存在已分配员工的方案：' + target.name + '（' + target.n + ' 人）');

/* A1：先做一次「无改动」的保存 → 不应弹窗（非金额改动 / 无改动不弹） */
await page.evaluate((id) => { window.Comm2Demo.openEdit(id); }, target.id);
await sleep(500);
await page.click('#comm2BtnSave');
await sleep(500);
const noChange = await page.evaluate(() => ({
  maskShown: document.getElementById('comm2RecalcMask').classList.contains('show'),
  listOn: !!document.querySelector('#screen-comm2-list:not(.hidden)'),
}));
ok(!noChange.maskShown, 'A1 无改动保存 → 不弹窗');
ok(noChange.listOn, 'A1 无改动保存 → 直接回列表');

/* A2：改一个**影响金额**的字段（计算基数 原价↔实收 或 覆盖支付范围）后再保存 → 弹窗 */
await page.evaluate((id) => { window.Comm2Demo.openEdit(id); }, target.id);
await sleep(500);
const clicked = await page.evaluate(() => {
  /* 取未被选中的那一侧（原价 / 实收）——切换 baseMode 属金额相关改动 */
  const btns = Array.from(document.querySelectorAll('#comm2EditCards [data-comm2-card-base]'));
  const off = btns.find((b) => b.getAttribute('aria-checked') === 'false');
  if (off) { off.click(); return off.getAttribute('data-comm2-card-base'); }
  return null;
});
ok(!!clicked, 'A2 已切换计算基数 → ' + clicked);
await sleep(400);
await page.click('#comm2BtnSave');
await sleep(500);

console.log('\n===== B · 弹窗形态与文案（31 次：两枚按钮即两个结果，无开关） =====');
const B = await page.evaluate(() => {
  const mask = document.getElementById('comm2RecalcMask');
  const dl = mask.querySelector('.dialog');
  const note = mask.querySelector('.comm2-recalc__note');
  const ico = mask.querySelector('.comm2-recalc__note-ico');
  const acts = mask.querySelector('.dialog__actions');
  const btnA = document.getElementById('comm2RecalcAll');
  const btnF = document.getElementById('comm2RecalcForward');
  const ra = btnA.getBoundingClientRect(), rf = btnF.getBoundingClientRect();
  const lines = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getClientRects().length; };
  const topmost = (el) => { const b = el.getBoundingClientRect(); const t = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return t ? t.id : null; };
  return {
    shown: mask.classList.contains('show'),
    title: document.getElementById('comm2RecalcTitle').textContent,
    /* 开关相关的节点必须全部不存在 */
    switchNodes: ['comm2RecalcToggle', 'comm2RecalcToggleLbl', 'comm2RecalcRow']
      .filter((id) => !!document.getElementById(id)),
    switchCls: mask.querySelectorAll('.comm2-recalc__switch, .comm2-recalc__row, .comm2-recalc__row-lbl').length,
    noteText: note ? note.textContent.trim() : null,
    noteIco: !!ico && !!ico.querySelector('svg'),
    noteFlex: note ? getComputedStyle(note).display : '',
    btnA: btnA ? btnA.textContent.trim() : null,
    btnF: btnF ? btnF.textContent.trim() : null,
    btnASecondary: btnA ? btnA.classList.contains('secondary') : false,
    btnFSecondary: btnF ? btnF.classList.contains('secondary') : false,
    /* 竖排：A 在 F 上方，且左边缘对齐、宽度一致 */
    stacked: Math.round(ra.bottom) <= Math.round(rf.top),
    sameLeft: Math.abs(ra.left - rf.left) < 1,
    sameW: Math.abs(ra.width - rf.width) < 1,
    wA: Math.round(ra.width), wF: Math.round(rf.width), hA: Math.round(ra.height),
    actionsDir: acts ? getComputedStyle(acts).flexDirection : '',
    actionsCls: acts ? acts.className : '',
    bodyW: Math.round(mask.querySelector('.comm2-recalc__body').getBoundingClientRect().width),
    overflowA: btnA ? btnA.scrollWidth - btnA.clientWidth : null,
    overflowF: btnF ? btnF.scrollWidth - btnF.clientWidth : null,
    linesA: btnA ? lines(btnA) : null,
    linesF: btnF ? lines(btnF) : null,
    topA: btnA ? topmost(btnA) : null,
    topF: btnF ? topmost(btnF) : null,
    leftovers: ['comm2RecalcLead', 'comm2RecalcImpact', 'comm2RecalcOpts', 'comm2RecalcOk',
      'comm2RecalcNext', 'comm2RecalcNow', 'comm2RecalcToggle', 'comm2RecalcToggleLbl']
      .filter((id) => !!document.getElementById(id)),
    grayStrips: mask.querySelectorAll('.comm2-recalc__impact, .comm2-recalc__lead, .comm2-recalc__opt').length,
    dialogW: dl ? Math.round(dl.getBoundingClientRect().width) : null,
    dialogMaxW: dl ? getComputedStyle(dl).maxWidth : null,
    maskZ: getComputedStyle(mask).zIndex,
  };
});
ok(B.shown, 'B1 弹窗已打开');
ok(B.title === '改方案后，提成怎么计算？', 'B2 标题为固定文案、不含方案名：' + B.title);
ok(B.switchNodes.length === 0 && B.switchCls === 0, 'B3 开关行已整块删除（残留：' + JSON.stringify(B.switchNodes) + ' / ' + B.switchCls + '）');
ok(/手工改过的订单/.test(B.noteText || ''), 'B4 人工修正提示：' + B.noteText);
ok(B.noteIco, 'B5 提示左侧有 ⓘ 图标（内联 SVG）');
ok(B.btnA === '本期全部重算', 'B6 第一枚按钮文案：' + B.btnA);
ok(B.btnF === '从现在起用新方案', 'B7 第二枚按钮文案：' + B.btnF);
ok(B.btnASecondary && !B.btnFSecondary, 'B8 左＝描边次要样式、「从现在起用新方案」为品牌主按钮');
ok(B.stacked, 'B9 两枚按钮**竖排**（上按钮底 ' + B.btnA + ' ≤ 下按钮顶 ' + B.btnF + '）');
ok(B.sameLeft && B.sameW, 'B10 两枚按钮左边缘对齐、等宽（左 ' + B.wA + 'px / 右 ' + B.wF + 'px、宽 ' + B.wA + ' / ' + B.wF + '）');
ok(B.actionsDir === 'column' && /dialog__actions--stack/.test(B.actionsCls), 'B11 按钮容器为 column 竖排（' + B.actionsCls + '）');
ok(Math.abs(B.wA - B.bodyW) <= 1, 'B12 按钮撑满内容宽（按钮 ' + B.wA + ' / 内容 ' + B.bodyW + '）');
ok(B.overflowA <= 0 && B.overflowF <= 0, 'B13 两枚按钮文案均不溢出（溢出量 ' + B.overflowA + ' / ' + B.overflowF + '）');
ok(B.linesA === 1 && B.linesF === 1, 'B14 两枚按钮文案均**不折行**（Range 行框数 ' + B.linesA + ' / ' + B.linesF + '）');
ok(B.topA === 'comm2RecalcAll' && B.topF === 'comm2RecalcForward',
  'B15 两枚按钮均可被真实点击命中（' + B.topA + ' / ' + B.topF + '）');
ok(B.leftovers.length === 0, 'B16 旧的开关 / 说明行 / 灰条 / 三张单选卡 / 左按钮 均已删除' + (B.leftovers.length ? '（残留：' + B.leftovers.join(',') + '）' : ''));
ok(B.grayStrips === 0, 'B17 弹窗内无灰条与选项卡残留：' + B.grayStrips);
ok(B.dialogMaxW === '326px' && B.dialogW > 300, 'B18 弹窗沿用 ModalPopup 规范（实际 ' + B.dialogW + 'px / max-width ' + B.dialogMaxW + '）');
ok(Number(B.maskZ) >= 50, 'B19 遮罩层级 ≥ 提成设置 sheet（z-index ' + B.maskZ + '）');

console.log('\n===== C · 必须二选一 =====');
const geo = await page.evaluate(() => {
  const m = document.getElementById('comm2RecalcMask');
  const d = m.querySelector('.dialog');
  const mb = m.getBoundingClientRect(), db = d.getBoundingClientRect();
  return { cx: mb.left + mb.width / 2, top: mb.top + 4, dialogTop: db.top };
});
await page.mouse.click(geo.cx, geo.top);
await sleep(300);
ok(await page.evaluate(() => document.getElementById('comm2RecalcMask').classList.contains('show')),
  'C1 点遮罩空白处 → 弹窗不关闭');
await page.keyboard.press('Escape');
await sleep(300);
ok(await page.evaluate(() => document.getElementById('comm2RecalcMask').classList.contains('show')),
  'C2 按 Esc → 弹窗不关闭');
ok(await page.evaluate(() => !document.querySelector('#comm2RecalcMask .btn-main.cancel') &&
  document.querySelectorAll('#comm2RecalcMask .dialog__actions .btn-main').length === 2),
  'C3 只有两枚按钮、无取消 → 必须二选一');

console.log('\n===== D · 第一枚按钮 → recalc（本期全部重算） =====');
await page.click('#comm2RecalcAll');
await sleep(700);
const D = await page.evaluate((id) => {
  const sch = window.Comm2Demo.getSchemes().find((s) => s.id === id);
  const card = document.querySelector('#comm2List [data-comm2-card="' + id + '"]');
  return {
    maskShown: document.getElementById('comm2RecalcMask').classList.contains('show'),
    listOn: !!document.querySelector('#screen-comm2-list:not(.hidden)'),
    mode: sch.effectiveMode,
    at: sch.effectiveAt,
    hasPrev: !!sch._prev,
    prevDefaults: sch._prev ? JSON.stringify(sch._prev.defaults).length : 0,
    fromField: 'effectiveFrom' in sch,
    badge: card ? !!card.querySelector('.comm2-scheme__badge') : false,
  };
}, target.id);
ok(!D.maskShown, 'D1 点第一枚按钮 → 弹窗关闭');
ok(D.listOn, 'D2 回到方案列表页');
ok(D.mode === 'recalc', 'D3 口径已落库 effectiveMode：' + D.mode);
ok(D.hasPrev, 'D4 已存改动前的规则快照 _prev（' + D.prevDefaults + ' 字节）');
ok(D.at === '', 'D5 recalc 不写 effectiveAt（立即生效）');
ok(!D.fromField, 'D6 不再写 effectiveFrom 字段（«下期生效» 能力已删）');
ok(!D.badge, 'D7 列表页无「下期生效」角标');

console.log('\n===== E · 第二枚按钮 → forward（从现在起用新方案） =====');
async function editAndSave(id) {
  await page.evaluate((i) => { window.Comm2Demo.openEdit(i); }, id);
  await sleep(500);
  /* 切换到**未被选中**的那一侧计算基数（必然产生金额相关改动 ⇒ 指纹变化） */
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('#comm2EditCards [data-comm2-card-base]'));
    const off = btns.find((b) => b.getAttribute('aria-checked') === 'false');
    if (off) off.click();
  });
  await sleep(360);
  await page.click('#comm2BtnSave');
  await sleep(600);
}
await editAndSave(target.id);
ok(await page.evaluate(() => document.getElementById('comm2RecalcMask').classList.contains('show')),
  'E1 再次保存改动 → 再次弹窗');
await page.click('#comm2RecalcForward');
await sleep(700);
const E = await page.evaluate((id) => {
  const sch = window.Comm2Demo.getSchemes().find((s) => s.id === id);
  return {
    mode: sch.effectiveMode,
    at: sch.effectiveAt,
    hasPrev: !!sch._prev,
    fromField: 'effectiveFrom' in sch,
    badge: !!document.querySelector('#comm2List [data-comm2-card="' + id + '"] .comm2-scheme__badge'),
    today: new Date().toISOString().slice(0, 10),
  };
}, target.id);
ok(E.mode === 'forward', 'E2 第二枚按钮 → forward（实际 ' + E.mode + '）');
ok(!!E.at, 'E3 forward 写入 effectiveAt：' + E.at);
ok(E.hasPrev, 'E4 _prev 快照已保存（改动保住）');
ok(!E.fromField, 'E5 不再写 effectiveFrom 字段');
ok(!E.badge, 'E6 无「下期生效」角标');

console.log('\n===== F · 非金额改动不弹 =====');
const F = await page.evaluate((id) => {
  window.Comm2Demo.openEdit(id);
  return true;
}, target.id);
await sleep(500);
/* 只改方案名（纯改名，不影响金额） */
const renamed = await page.evaluate(() => {
  const el = document.getElementById('comm2EditTitleText');
  return { before: el.textContent, ok: true };
});
ok(F && renamed.ok, 'F0 已进入编辑页（改名前：' + renamed.before + '）');
/* 直接改 store 里的名字（等价于走改名弹窗的落点），再保存 */
await page.evaluate((id) => {
  const s = window.Comm2Demo.getSchemes().find((x) => x.id === id);
  s.name = s.name.indexOf('·改') >= 0 ? s.name.replace('·改', '') : (s.name + '·改');
}, target.id);
await page.click('#comm2BtnSave');
await sleep(600);
const F2 = await page.evaluate(() => ({
  maskShown: document.getElementById('comm2RecalcMask').classList.contains('show'),
  listOn: !!document.querySelector('#screen-comm2-list:not(.hidden)'),
}));
ok(!F2.maskShown, 'F1 纯改名保存 → 不弹窗（不影响金额）');
ok(F2.listOn, 'F2 纯改名保存 → 直接回列表');

console.log('\n===== G · 两种口径的计算差异 =====');
const G = await page.evaluate((id) => {
  const sch = window.Comm2Demo.getSchemes().find((s) => s.id === id);
  const staffId = (sch.assigneeIds || [])[0];
  function tune(blocks, rate) {
    const out = {};
    Object.keys(blocks).forEach(function (k) {
      const b = JSON.parse(JSON.stringify(blocks[k]));
      b.pickMode = 'avg';
      b.payScope = { cash: true, memberCard: true, groupBuy: true };
      b.rule.extraSplit = false;
      b.rule.nonDesignatedValueMode = 'pct';
      b.rule.nonDesignated = rate;
      b.rule.nonDesignatedAmt = 0;
      Object.keys(b.rule.stations || {}).forEach(function (sid) {
        b.rule.stations[sid] = { nonDesignated: rate, nonDesignatedAmt: 0, valueMode: 'pct' };
      });
      out[k] = b;
    });
    return out;
  }
  /* 老规则 10%，新规则 20%；所有行都走 defaults（清空覆盖） */
  sch._prev = {
    defaults: tune(sch.defaults, 10),
    overrides: [],
    stationIds: (sch.stationIds || []).slice(),
    stationLabels: JSON.parse(JSON.stringify(sch.stationLabels || {}))
  };
  sch.defaults = tune(sch.defaults, 20);
  sch.overrides = [];

  const lines = [
    { id: 'gt1', name: '测试·改前', cat: 'labor', kind: 'project', refId: 'gt_p1', pay: 'cash', list: 1000, paid: 1000, extra: false, ymd: '2026-09-10' },
    { id: 'gt2', name: '测试·改后', cat: 'labor', kind: 'project', refId: 'gt_p2', pay: 'cash', list: 1000, paid: 1000, extra: false, ymd: '2026-09-25' }
  ];
  const PK = '2026-09';
  function total(mode, at) {
    sch.effectiveMode = mode;
    sch.effectiveAt = at || '';
    const r = window.Comm2Demo.calcStaffTrial(staffId, lines, PK);
    return { total: r.total, per: r.rows.map(function (x) { return x.amount; }) };
  }
  return {
    staffId: staffId,
    recalc: total('recalc', ''),
    forward: total('forward', '2026-09-20'),
    noPrev: (function () { delete sch._prev; return total('forward', '2026-09-20'); })()
  };
}, target.id);
console.log('    recalc  =', JSON.stringify(G.recalc));
console.log('    forward =', JSON.stringify(G.forward));
ok(G.recalc.total === 400, 'G1 recalc → 本期两行全按新规则 20% = 400（实际 ' + G.recalc.total + '）');
ok(G.forward.total === 300, 'G2 forward → 改前 10% + 改后 20% = 300（实际 ' + G.forward.total + '）');
ok(G.forward.per[0] !== G.forward.per[1], 'G3 forward 在期内**按日期切分**：' + JSON.stringify(G.forward.per));
ok(G.recalc.per[0] === G.recalc.per[1], 'G4 recalc 期内不切分：' + JSON.stringify(G.recalc.per));
ok(G.noPrev.total === 400, 'G5 无 _prev（历史方案）→ 一律新规则，不受口径影响（实际 ' + G.noPrev.total + '）');

console.log('\n===== H · 弹窗未回答就退出的兜底默认（forward） =====');
/* H0：先把方案重置成「干净」状态，避免 G 段留下的 _prev / effectiveMode 干扰 */
async function armDialog() {
  /* 进编辑页 → 改一个影响金额的字段 → 保存 → 进入重算弹窗（不做任何选择） */
  await page.evaluate((id) => { window.Comm2Demo.openEdit(id); }, target.id);
  await sleep(500);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('#comm2EditCards [data-comm2-card-base]'));
    const off = btns.find((b) => b.getAttribute('aria-checked') === 'false');
    if (off) off.click();
  });
  await sleep(360);
  await page.click('#comm2BtnSave');
  await sleep(600);
}

const H0 = await page.evaluate(() => ({
  masks: Array.from(document.querySelectorAll('.dialog-mask')).filter((m) => m.classList.contains('show')).map((m) => m.id),
}));
ok(H0.masks.length === 0, 'H0 起点无任何弹窗开启：' + JSON.stringify(H0.masks));

/* ① openList()：任何回列表的路径（含顶部导航）—— 未回答就该落 forward，且改动不能丢 */
await armDialog();
ok(await page.evaluate(() => document.getElementById('comm2RecalcMask').classList.contains('show')),
  'H1 弹窗已打开且未做任何选择');
await page.evaluate(() => { window.Comm2Demo.openList(); });
await sleep(700);
const H3 = await page.evaluate((id) => {
  const s = window.Comm2Demo.getSchemes().find((x) => x.id === id);
  const toast = document.querySelector('.toast-msg');
  return {
    mask: document.getElementById('comm2RecalcMask').classList.contains('show'),
    listOn: !!document.querySelector('#screen-comm2-list:not(.hidden)'),
    mode: s.effectiveMode,
    at: s.effectiveAt,
    fromField: 'effectiveFrom' in s,
    hasPrev: !!s._prev,
    autoFlag: Object.keys(s).filter((k) => /auto/i.test(k)),
    toast: toast ? toast.textContent.trim() : null,
  };
}, target.id);
ok(!H3.mask, 'H2 回列表 → 弹窗关闭');
ok(H3.listOn, 'H3 已回到方案列表');
ok(H3.mode === 'forward', 'H4 兜底口径 = forward（实际 ' + H3.mode + '）');
ok(!!H3.at && !H3.fromField, 'H5 effectiveAt 已写、无 effectiveFrom（' + H3.at + '）');
ok(H3.hasPrev, 'H6 _prev 快照已保存（改动保住）');
ok(H3.autoFlag.length === 0, 'H7 不留「系统默认」标记字段：' + JSON.stringify(H3.autoFlag));
ok(/从现在起用新方案/.test(H3.toast || ''), 'H8 兜底 toast：' + H3.toast);

/* ② 幂等：再调一次 openList 不得产生二次落库 / 报错 */
const H9 = await page.evaluate(() => {
  const n = window.Comm2Demo.getSchemes().length;
  window.Comm2Demo.openList();
  return { n: n, after: window.Comm2Demo.getSchemes().length };
});
await sleep(300);
ok(H9.n === H9.after, 'H9 兜底幂等：重复回列表不产生二次落库（' + H9.n + ' → ' + H9.after + '）');

/* ③ 返回按钮路径：未回答就点返回 → 也落 forward，且不再弹「尚未保存」 */
await armDialog();
await page.evaluate(() => { document.getElementById('comm2EditBack').click(); });
await sleep(700);
const H11 = await page.evaluate((id) => {
  const s = window.Comm2Demo.getSchemes().find((x) => x.id === id);
  return {
    recalc: document.getElementById('comm2RecalcMask').classList.contains('show'),
    unsaved: document.getElementById('comm2UnsavedMask').classList.contains('show'),
    listOn: !!document.querySelector('#screen-comm2-list:not(.hidden)'),
    mode: s.effectiveMode,
  };
}, target.id);
ok(!H11.recalc, 'H10 返回按钮 → 重算弹窗关闭');
ok(!H11.unsaved, 'H11 返回按钮 → 不再弹「尚未保存」（改动已保存）');
ok(H11.listOn && H11.mode === 'forward', 'H12 返回按钮也被兜底为 forward（实际 ' + H11.mode + '）');

/* ④ pagehide 路径：关闭 / 刷新页面 */
await armDialog();
await page.evaluate(() => { window.dispatchEvent(new Event('pagehide')); });
await sleep(500);
const H14 = await page.evaluate((id) => {
  const s = window.Comm2Demo.getSchemes().find((x) => x.id === id);
  return { mode: s.effectiveMode, mask: document.getElementById('comm2RecalcMask').classList.contains('show') };
}, target.id);
ok(H14.mode === 'forward' && !H14.mask, 'H13 pagehide（关闭 / 刷新）也落到 forward（实际 ' + H14.mode + '）');

/* ⑤ 两枚按钮的正常路径不得被兜底二次触发 */
await armDialog();
await page.click('#comm2RecalcAll');
await sleep(700);
const H15 = await page.evaluate((id) => {
  const s = window.Comm2Demo.getSchemes().find((x) => x.id === id);
  return { mode: s.effectiveMode, at: s.effectiveAt };
}, target.id);
ok(H15.mode === 'recalc' && H15.at === '',
  'H14 点第一枚按钮 → 仍是 recalc（未被兜底覆盖为 forward）：' + H15.mode);

console.log('\n================ ' + pass + ' PASS / ' + fail + ' FAIL ================');
await browser.close();
process.exit(fail ? 1 : 0);
