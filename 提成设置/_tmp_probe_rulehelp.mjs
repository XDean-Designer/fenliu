/* 探针：方案编辑页标题右侧 ⓘ 信息增强入口 + 「提成怎么设、钱怎么算」帮助弹窗（PRD §6.2.2 / §6.9） */
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
await sleep(1500);

/* 进方案编辑页 */
await page.evaluate(() => {
  window.Comm2Demo.openList();
  var s = window.Comm2Demo.getSchemes();
  window.Comm2Demo.openEdit(s[0].id);
});
await sleep(600);

console.log('\n===== A · 标题栏 ⓘ 入口 =====');
const A = await page.evaluate(() => {
  const bar = document.querySelector('#screen-comm2-edit .page-title-bar');
  const btn = document.getElementById('comm2EditHelpBtn');
  const txt = document.getElementById('comm2EditTitleText');
  const title = document.getElementById('comm2EditTitle');
  const svg = btn && btn.querySelector('svg');
  const r = btn && btn.getBoundingClientRect();
  const tr = txt && txt.getBoundingClientRect();
  const br = bar.getBoundingClientRect();
  return {
    screenOn: !document.getElementById('screen-comm2-edit').classList.contains('hidden'),
    hasBtn: !!btn,
    titleCls: title ? title.className : '',
    titleText: txt ? txt.textContent : null,
    titleTag: title ? title.tagName : '',
    btnLabel: btn ? btn.getAttribute('aria-label') : null,
    btnSvg: !!svg,
    btnW: r ? Math.round(r.width) : null,
    btnH: r ? Math.round(r.height) : null,
    btnColor: btn ? getComputedStyle(btn).color : null,
    btnLeftOfTitleRight: r && tr ? Math.round(r.left - tr.right) : null,
    btnInBar: r && br ? (r.left >= br.left && r.right <= br.right) : null,
    barCenter: Math.round(br.left + br.width / 2),
    titleCenter: tr ? Math.round(tr.left + tr.width / 2) : null,
    titleTxtStyle: txt ? [getComputedStyle(txt).overflow, getComputedStyle(txt).textOverflow, getComputedStyle(txt).whiteSpace].join('/') : null,
  };
});
console.log(' ', JSON.stringify(A));
ok(A.screenOn, 'A1 已在方案编辑页');
ok(A.hasBtn && A.btnSvg, 'A2 标题右侧存在 ⓘ（svg）');
ok(A.titleTag === 'SPAN' && /title--with-help/.test(A.titleCls), 'A3 标题为 span.title.title--with-help');
ok(A.btnLabel === '提成怎么设置、钱怎么算', 'A4 aria-label 正确');
ok(A.titleText && A.titleText.length > 0 && A.titleText !== '提成设置', 'A5 标题文字被方案名覆盖后仍在（未被 innerHTML 清掉）: ' + A.titleText);
ok(A.btnW === 20 && A.btnH === 20, 'A6 ⓘ 热区 20×20（实 ' + A.btnW + '×' + A.btnH + '）');
ok(A.btnColor === 'rgb(178, 178, 178)', 'A7 ⓘ 颜色 #B2B2B2（实 ' + A.btnColor + '）');
ok(A.btnLeftOfTitleRight !== null && Math.abs(A.btnLeftOfTitleRight) <= 8, 'A8 ⓘ 紧贴标题文字右侧（间距 ' + A.btnLeftOfTitleRight + 'px）');
ok(A.btnInBar === true, 'A9 ⓘ 未溢出标题栏');
ok(A.titleTxtStyle === 'hidden/ellipsis/nowrap', 'A10 标题文字可省略（over/ellipsis/nowrap），ⓘ 恒可见（实 ' + A.titleTxtStyle + '）');

console.log('\n===== B · 长方案名不挤掉 ⓘ =====');
const B = await page.evaluate(() => {
  const txt = document.getElementById('comm2EditTitleText');
  const real = txt.textContent;
  txt.textContent = '超级长的提成方案名称测试一二三四五六七八九十';
  const btn = document.getElementById('comm2EditHelpBtn');
  const br = btn.getBoundingClientRect();
  const bar = document.querySelector('#screen-comm2-edit .page-title-bar').getBoundingClientRect();
  const out = {
    btnVisible: br.width > 0 && br.right <= bar.right && br.left >= bar.left,
    txtClipped: txt.scrollWidth > txt.clientWidth + 1,
    txtOverflow: getComputedStyle(txt).textOverflow,
  };
  txt.textContent = real;
  return out;
});
console.log(' ', JSON.stringify(B));
ok(B.btnVisible, 'B1 方案名超长时 ⓘ 仍完整可见（不溢出标题栏）');
ok(B.txtClipped && B.txtOverflow === 'ellipsis', 'B2 方案名自身省略号截断');

console.log('\n===== C · 弹窗打开与结构 =====');
const before = await page.evaluate(() => getComputedStyle(document.getElementById('comm2RuleHelpMask')).display);
await page.click('#comm2EditHelpBtn');
await sleep(400);
const C = await page.evaluate(() => {
  const mask = document.getElementById('comm2RuleHelpMask');
  const dlg = mask.querySelector('.dialog');
  const dr = dlg.getBoundingClientRect();
  const h4 = [...mask.querySelectorAll('h4')].map((e) => e.textContent);
  const lists = [...mask.querySelectorAll('.comm2-hint-list')];
  return {
    cls: mask.className,
    isHelpStyle: dlg.classList.contains('dialog--emp-help'),
    dialogTitle: mask.querySelector('.dialog__title').textContent,
    hasScroll: !!mask.querySelector('.dialog__scroll.emp-help-body'),
    h4: h4,
    listCount: lists.length,
    noPerList: lists.map((l) => l.querySelectorAll('.comm2-hint-item').length),
    nums: lists.map((l) => [...l.querySelectorAll('.comm2-hint-item__no')].map((n) => n.textContent)),
    firstT: (mask.querySelector('.comm2-hint-item__t') || {}).textContent,
    firstD: (mask.querySelector('.comm2-hint-item__d') || {}).textContent,
    ttWeight: (() => { const e = mask.querySelector('.comm2-hint-item__t'); return e ? getComputedStyle(e).fontWeight : null; })(),
    ttSize: (() => { const e = mask.querySelector('.comm2-hint-item__t'); return e ? getComputedStyle(e).fontSize : null; })(),
    ddSize: (() => { const e = mask.querySelector('.comm2-hint-item__d'); return e ? getComputedStyle(e).fontSize : null; })(),
    ddColor: (() => { const e = mask.querySelector('.comm2-hint-item__d'); return e ? getComputedStyle(e).color : null; })(),
    ttColor: (() => { const e = mask.querySelector('.comm2-hint-item__t'); return e ? getComputedStyle(e).color : null; })(),
    dlgW: Math.round(dr.width), dlgH: Math.round(dr.height),
    okBtn: (mask.querySelector('#comm2RuleHelpOk') || {}).textContent,
    hasNestedP: !!mask.querySelector('.comm2-hint-item__main > p'),
  };
});
console.log(' ', JSON.stringify(C));
ok(/show/.test(C.cls), 'C1 点 ⓘ 后弹窗打开（.show）');
ok(before === 'none', 'C2 打开前弹窗不可见（display none，实 ' + before + '）');
ok(C.isHelpStyle && C.hasScroll, 'C3 复用 dialog--emp-help + dialog__scroll.emp-help-body');
ok(C.dialogTitle === '提成怎么设、钱怎么算', 'C4 弹窗标题白话一致');
ok(C.h4.length === 2 && C.h4[0] === '一、怎么设置（5 步）' && C.h4[1] === '二、钱怎么算出来（8 条）', 'C5 两个分节标题：' + C.h4.join(' | '));
ok(C.listCount === 2 && C.noPerList[0] === 5 && C.noPerList[1] === 8, 'C6 条目数 5 + 8（实 ' + C.noPerList.join(' + ') + '）');
ok(JSON.stringify(C.nums[0]) === JSON.stringify(['1', '2', '3', '4', '5']) && JSON.stringify(C.nums[1]) === JSON.stringify(['1', '2', '3', '4', '5', '6', '7', '8']), 'C7 序号各自从 1 连续');
ok(!!C.firstT && !!C.firstD, 'C8 每条有「加粗结论 + 灰字补充」两段：' + JSON.stringify(C.firstT) + ' / ' + JSON.stringify(C.firstD));
ok(C.ttWeight === '600' && C.ttSize === '13px', 'C9 结论加粗 13px（实 ' + C.ttWeight + ' / ' + C.ttSize + '）');
ok(C.ddSize === '12px' && C.ddColor === 'rgb(146, 146, 146)', 'C10 补充灰字 12px #929292（实 ' + C.ddSize + ' / ' + C.ddColor + '）');
ok(C.ttColor === 'rgb(51, 51, 51)', 'C11 结论主色 var(--text) #333（实 ' + C.ttColor + '）');
ok(C.dlgW <= 390 && C.dlgH <= 880, 'C12 弹窗不超出视口（实 ' + C.dlgW + '×' + C.dlgH + '）');
ok(C.okBtn === '知道了', 'C13 底部单按钮「知道了」');

console.log('\n===== D · 排版与滚动 =====');
const D = await page.evaluate(() => {
  const mask = document.getElementById('comm2RuleHelpMask');
  const scroll = mask.querySelector('.dialog__scroll');
  const items = [...mask.querySelectorAll('.comm2-hint-item')];
  const overflowX = items.filter((it) => it.scrollWidth > it.clientWidth + 1).length;
  const noRects = [...mask.querySelectorAll('.comm2-hint-item__no')].map((n) => {
    const r = n.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), r: getComputedStyle(n).borderRadius, bg: getComputedStyle(n).backgroundColor, fs: getComputedStyle(n).fontSize, lh: getComputedStyle(n).lineHeight };
  });
  const first = items[0];
  const noR = first.querySelector('.comm2-hint-item__no').getBoundingClientRect();
  const txtR = first.querySelector('.comm2-hint-item__main').getBoundingClientRect();
  const h4R = mask.querySelector('h4').getBoundingClientRect();
  return {
    noAll: noRects.every((n) => n.w === 18 && n.h === 18 && n.r === '50%' && n.bg === 'rgb(240, 240, 240)' && n.fs === '11px' && n.lh === '18px'),
    noSample: noRects[0],
    overflowX,
    scrollable: getComputedStyle(scroll).overflowY,
    // 序号右缘 → 文字左缘 的间距
    gap: Math.round(txtR.left - noR.right),
    // 序号左缘 是否与分节标题左缘对齐
    noLeft: Math.round(noR.left),
    h4Left: Math.round(h4R.left),
  };
});
console.log(' ', JSON.stringify(D));
ok(D.noAll, 'D1 序号圆点 18×18 / 圆形 50% / #F0F0F0 / 11px 居中（样本 ' + JSON.stringify(D.noSample) + '）');
ok(D.overflowX === 0, 'D2 无条目横向溢出（实 ' + D.overflowX + ' 条）');
ok(D.scrollable === 'auto' || D.scrollable === 'scroll', 'D3 内容区可滚动（overflow-y: ' + D.scrollable + '）');
ok(D.gap === 8, 'D4 序号与文字间距 8px（实 ' + D.gap + '）');
ok(D.noLeft === D.h4Left, 'D5 序号与分节标题左对齐（' + D.noLeft + ' vs ' + D.h4Left + '）');

console.log('\n===== E · 关闭路径 =====');
await page.click('#comm2RuleHelpOk');
await sleep(300);
let E1 = await page.evaluate(() => document.getElementById('comm2RuleHelpMask').className);
ok(!/show/.test(E1), 'E1 点「知道了」关闭（实 "' + E1 + '"）');
await page.click('#comm2EditHelpBtn'); await sleep(300);
await page.evaluate(() => { const m = document.getElementById('comm2RuleHelpMask'); m.click(); });
await sleep(300);
let E2 = await page.evaluate(() => document.getElementById('comm2RuleHelpMask').className);
ok(!/show/.test(E2), 'E2 点遮罩空白关闭（实 "' + E2 + '"）');
/* 回归：列表页帮助仍在，且弹的不是新弹窗 */
await page.evaluate(() => window.Comm2Demo.openList());
await sleep(400);
await page.click('#comm2HelpBtn');
await sleep(300);
const E3 = await page.evaluate(() => ({
  list: document.getElementById('comm2HelpMask').className,
  rule: document.getElementById('comm2RuleHelpMask').className,
  listTitle: document.getElementById('comm2HelpTitle').textContent,
}));
ok(/show/.test(E3.list) && !/show/.test(E3.rule), 'E3 列表页 ⓘ 打开列表页自己的弹窗（`#comm2HelpMask`），未串到编辑页弹窗（实标题「' + E3.listTitle + '」）');

console.log('\n===== 汇总：' + pass + ' PASS / ' + fail + ' FAIL =====');
await browser.close();
process.exit(fail ? 1 : 0);
