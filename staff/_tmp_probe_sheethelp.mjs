/* 探针：规则 Sheet 行标签后的 ⓘ（计算基数说明 / 分配模式说明）—— 补上原本「只有 markup、无触发入口」的两个弹窗 */
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
await page.setViewport({ width: 1100, height: 880, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('  [pageerror]', e.message));

await page.goto(base + '?view=desktop', { waitUntil: 'load', timeout: 30000 });
await sleep(1500);

/* 进编辑页 → 打开第 1 张规则卡的 Sheet */
await page.evaluate(() => {
  window.Comm2Demo.openList();
  var s = window.Comm2Demo.getSchemes();
  window.Comm2Demo.openEdit(s[0].id);
});
await sleep(600);
await page.evaluate(() => {
  var b = document.querySelector('#comm2EditCards [data-comm2-card-open]');
  if (b) b.click();
});
await sleep(600);

const sheetOpen = await page.evaluate(() => document.getElementById('comm2CatSheetMask').className);
console.log('sheet class:', sheetOpen);

console.log('\n===== A · 行标签 ⓘ 存在性与样式 =====');
const A = await page.evaluate(() => {
  const body = document.getElementById('comm2CatSheetBody');
  /* 标签文字真实宽度（Range 只量文本节点，不含 ⓘ） */
  const textW = (lbl) => {
    const r = document.createRange();
    r.selectNodeContents(lbl);
    /* 排除按钮节点：先临时取第一个文本节点 */
    const tn = [...lbl.childNodes].find((n) => n.nodeType === 3);
    if (!tn) return null;
    const r2 = document.createRange();
    r2.selectNodeContents(tn);
    return Math.round(r2.getBoundingClientRect().width);
  };
  const rows = [...body.querySelectorAll('.comm2-sheet-row')].map((r) => {
    const lbl = r.querySelector('.comm2-sheet-row__lbl');
    const btn = r.querySelector('[data-comm2-sheet-help]');
    const ctrl = r.querySelector('.comm2-sheet-row__ctrl');
    const lr = lbl.getBoundingClientRect();
    const br = btn && btn.getBoundingClientRect();
    const cr = ctrl.getBoundingClientRect();
    return {
      text: lbl.textContent.replace('?', '').trim(),
      help: btn ? btn.getAttribute('data-comm2-sheet-help') : null,
      aria: btn ? btn.getAttribute('aria-label') : null,
      role: btn ? btn.textContent : null,
      lblW: Math.round(lr.width),
      lblL: Math.round(lr.left),
      txtW: textW(lbl),
      gapToBtn: btn ? Math.round(br.left - lr.left - (textW(lbl) || 0)) : null,
      btnW: br ? Math.round(br.width) : null,
      btnH: br ? Math.round(br.height) : null,
      btnRightPastLbl: br ? Math.round(br.right - lr.right) : null,
      btnRadius: btn ? getComputedStyle(btn).borderRadius : null,
      btnBorder: btn ? getComputedStyle(btn).borderColor : null,
      btnColor: btn ? getComputedStyle(btn).color : null,
      btnFont: btn ? getComputedStyle(btn).fontSize : null,
      btnClearOfCtrl: br ? (br.right <= cr.left + 0.5) : null,
      ctrlLeft: Math.round(cr.left),
      lblH: Math.round(lr.height),
    };
  });
  const cs = getComputedStyle(document.querySelector('.comm2-sheet-row--params-head .comm2-sheet-row__lbl'));
  return { rows, paramsLblDisplay: cs.display, paramsLblAlign: cs.alignItems };
});
A.rows.forEach((r) => console.log('  ·', JSON.stringify(r)));
ok(A.rows.filter((r) => r.help === 'base').length === 1, 'A1 有且仅有 1 行带 「计算基数」ⓘ');
ok(A.rows.filter((r) => r.help === 'pick').length === 1, 'A2 有且仅有 1 行带 「分配模式」ⓘ');
ok(A.rows.filter((r) => r.help).length === 2, 'A3 全 Sheet 只有这两个 ⓘ（其余行无）');
ok(A.rows.filter((r) => r.help === 'base')[0].aria === '计算基数说明', 'A4 计算基数 ⓘ 的 aria-label = 「计算基数说明」');
ok(A.rows.filter((r) => r.help === 'pick')[0].aria === '分配模式说明', 'A5 分配模式 ⓘ 的 aria-label = 「分配模式说明」');
ok(A.rows.every((r) => !r.help || (r.btnW === 14 && r.btnH === 14 && r.btnRadius === '50%')), 'A6 ⓘ 为 14×14 圆形（复用 .emp-ach-info-btn）');
ok(A.rows.every((r) => !r.help || r.btnColor === 'rgb(146, 146, 146)'), 'A7 ⓘ 色值 #929292');
ok(A.rows.every((r) => !r.help || r.btnFont === '9px'), 'A8 ⓘ 内「?」9px');
ok(A.rows.every((r) => !r.help || r.btnClearOfCtrl !== false), 'A9 ⓘ 未压到控件区（btn.right ≤ ctrl.left）');
ok(A.rows.every((r) => !r.help || r.lblH <= 20), 'A10 行标签仍为单行（未换行，高度 ' + A.rows.filter((r) => r.help)[0].lblH + 'px）');
ok(A.rows.every((r) => r.lblW === 72), 'A11 行标签列宽仍为 72px（无位移）');
ok(A.paramsLblDisplay === 'flex' && A.paramsLblAlign === 'center', 'A12 行标签容器为弹性居中（display:' + A.paramsLblDisplay + ' / align:' + A.paramsLblAlign + '）');

console.log('\n===== B · 控件区左缘与重渲染后仍可点 =====');
const ctrlLeftBefore = A.rows.find((r) => r.text === '计算基数').ctrlLeft;
/* 触发一次 Sheet 重渲染（切支付范围 chip） */
await page.evaluate(() => {
  const c = document.querySelector('#comm2CatSheetBody [data-comm2-sheet-scope]');
  if (c) c.click();
});
await sleep(400);
const B = await page.evaluate(() => {
  const body = document.getElementById('comm2CatSheetBody');
  const rows = [...body.querySelectorAll('.comm2-sheet-row')];
  const row = rows.find((r) => r.querySelector('.comm2-sheet-row__lbl').textContent.indexOf('计算基数') === 0);
  const cr = row.querySelector('.comm2-sheet-row__ctrl').getBoundingClientRect();
  return {
    btnAfterRedraw: !!row.querySelector('[data-comm2-sheet-help="base"]'),
    ctrlLeft: Math.round(cr.left),
    helpCount: body.querySelectorAll('[data-comm2-sheet-help]').length,
  };
});
console.log(' ', JSON.stringify(B));
ok(B.btnAfterRedraw, 'B1 Sheet 重渲染后 ⓘ 仍在（委派生效，非一次性绑定）');
ok(B.helpCount === 2, 'B2 重渲染后仍恰好 2 个 ⓘ');
ok(B.ctrlLeft === ctrlLeftBefore, 'B3 控件区左缘与改前一致（' + ctrlLeftBefore + ' → ' + B.ctrlLeft + '）');

console.log('\n===== C · 点「计算基数」ⓘ → 基数说明弹窗（浮在 Sheet 之上） =====');
await page.click('#comm2CatSheetBody [data-comm2-sheet-help="base"]');
await sleep(400);
const C = await page.evaluate(() => {
  const m = document.getElementById('comm2BaseHelpMask');
  const s = document.getElementById('comm2CatSheetMask');
  const d = m.querySelector('.dialog');
  return {
    maskCls: m.className,
    sheetStillOpen: /open/.test(s.className),
    title: document.getElementById('comm2BaseHelpTitle').textContent,
    z: getComputedStyle(m).zIndex, sheetZ: getComputedStyle(s).zIndex,
    h4: [...m.querySelectorAll('h4')].map((e) => e.textContent),
    dlgW: Math.round(d.getBoundingClientRect().width),
    dlgH: Math.round(d.getBoundingClientRect().height),
  };
});
console.log(' ', JSON.stringify(C));
ok(/show/.test(C.maskCls), 'C1 点 ⓘ 打开「计算基数说明」');
ok(C.title === '计算基数说明', 'C2 弹窗标题正确');
ok(C.sheetStillOpen, 'C3 说明弹窗打开时 Sheet 保持打开（可读着说明继续配）');
ok(Number(C.z) > Number(C.sheetZ), 'C4 说明弹窗层级高于 Sheet（' + C.z + ' > ' + C.sheetZ + '）');
ok(C.h4.join('|') === '原价模式|实收模式', 'C5 内容两节可在原型读到：' + C.h4.join(' | '));
ok(C.dlgW <= 390 && C.dlgH <= 880, 'C6 弹窗不超视口（' + C.dlgW + '×' + C.dlgH + '）');

console.log('\n===== D · 关闭路径（都不关 Sheet） =====');
await page.click('#comm2BaseHelpOk');
await sleep(300);
let D1 = await page.evaluate(() => ({
  base: document.getElementById('comm2BaseHelpMask').className,
  sheet: document.getElementById('comm2CatSheetMask').className,
}));
ok(!/show/.test(D1.base) && /open/.test(D1.sheet), 'D1 点「知道了」关闭说明弹窗、Sheet 仍开');

await page.click('#comm2CatSheetBody [data-comm2-sheet-help="base"]'); await sleep(300);
await page.evaluate(() => document.getElementById('comm2BaseHelpMask').click());
await sleep(300);
let D2 = await page.evaluate(() => ({
  base: document.getElementById('comm2BaseHelpMask').className,
  sheet: document.getElementById('comm2CatSheetMask').className,
}));
ok(!/show/.test(D2.base) && /open/.test(D2.sheet), 'D2 点说明弹窗遮罩空白关闭、Sheet 仍开');

console.log('\n===== E · 点「分配模式」ⓘ =====');
await page.click('#comm2CatSheetBody [data-comm2-sheet-help="pick"]');
await sleep(400);
const E = await page.evaluate(() => ({
  pick: document.getElementById('comm2PickHelpMask').className,
  base: document.getElementById('comm2BaseHelpMask').className,
  title: document.getElementById('comm2PickHelpTitle').textContent,
  h4: [...document.querySelectorAll('#comm2PickHelpMask h4')].map((e) => e.textContent),
  text: document.querySelector('#comm2PickHelpMask .emp-help-body').textContent,
  sheet: document.getElementById('comm2CatSheetMask').className,
}));
console.log('  title:', E.title, '| h4:', E.h4.join(' / '));
ok(/show/.test(E.pick) && !/show/.test(E.base), 'E1 点「分配模式」ⓘ 打开对应弹窗（未串到基数说明）');
ok(E.title === '分配模式说明', 'E2 标题正确');
ok(E.h4.join('|') === '不分工位|按工位分配', 'E3 内容两节：' + E.h4.join(' | '));
ok(E.text.indexOf('也可以只勾「顾客指定」单独分配') >= 0 && E.text.indexOf('此种情况只发顾客指定提成') >= 0,
  'E4 内容含十七次口径（不分工位「也可以只勾顾客指定单独分配」+ 按工位「此种情况只发顾客指定提成」）');
ok(/open/.test(E.sheet), 'E5 Sheet 仍开');
await page.click('#comm2PickHelpOk'); await sleep(300);
const E2 = await page.evaluate(() => document.getElementById('comm2PickHelpMask').className);
ok(!/show/.test(E2), 'E6 点「知道了」关闭');

console.log('\n===== F · 其他 Sheet 行不受影响 =====');
const F = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('#comm2CatSheetBody .comm2-sheet-row')];
  const get = (t) => rows.find((r) => r.querySelector('.comm2-sheet-row__lbl').textContent.indexOf(t) === 0);
  const r = get('适用范围');
  const seg = get('计算基数').querySelector('.comm2-sheet-row__ctrl .comm2-base-seg');
  const ctrlR = get('计算基数').querySelector('.comm2-sheet-row__ctrl').getBoundingClientRect();
  const sr = seg.getBoundingClientRect();
  return {
    scopeNoHelp: !r.querySelector('[data-comm2-sheet-help]'),
    segFillsCtrl: Math.abs(sr.width - (ctrlR.width - 0)) <= 1,
    segRight: Math.round(sr.right), ctrlRight: Math.round(ctrlR.right),
    headNoHelp: !document.querySelector('.comm2-sheet-row--params-head [data-comm2-sheet-help]'),
  };
});
console.log(' ', JSON.stringify(F));
ok(F.scopeNoHelp, 'F1 「适用范围」行无 ⓘ');
ok(F.headNoHelp, 'F2 「提成参数」表头行无 ⓘ');
ok(F.segRight === F.ctrlRight, 'F3 「计算基数」段控仍占满控件区右端（' + F.segRight + ' = ' + F.ctrlRight + '）');

console.log('\n===== 汇总：' + pass + ' PASS / ' + fail + ' FAIL =====');
await browser.close();
process.exit(fail ? 1 : 0);
