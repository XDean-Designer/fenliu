/* 探针：方案列表页标题右侧 ⓘ 的白话版帮助弹窗「一个人挂几个方案，钱怎么算」（PRD §6.1 / §6.9 二十三次） */
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

const TITLE = '一个人挂几个方案，钱怎么算';

const browser = await puppeteer.launch({ executablePath: browserPath, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 880, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('  [pageerror]', e.message));

await page.goto(base + '?view=desktop', { waitUntil: 'load', timeout: 30000 });
await sleep(1500);
await page.evaluate(() => window.Comm2Demo.openList());
await sleep(500);

console.log('\n===== A · 列表页标题栏 ⓘ 入口 =====');
const A = await page.evaluate(() => {
  const btn = document.getElementById('comm2HelpBtn');
  const bar = document.querySelector('#screen-comm2-list .page-title-bar');
  const r = btn.getBoundingClientRect();
  const br = bar.getBoundingClientRect();
  return {
    label: btn.getAttribute('aria-label'),
    hasSvg: !!btn.querySelector('svg'),
    w: Math.round(r.width), h: Math.round(r.height),
    color: getComputedStyle(btn).color,
    inBar: r.left >= br.left && r.right <= br.right,
    screenOn: !document.getElementById('screen-comm2-list').classList.contains('hidden'),
  };
});
console.log(' ', JSON.stringify(A));
ok(A.screenOn, 'A1 已在方案列表页');
ok(A.hasSvg, 'A2 标题右侧存在 ⓘ（svg）');
ok(A.label === TITLE, 'A3 aria-label 已改白话（实 "' + A.label + '"）');
ok(A.w === 20 && A.h === 20, 'A4 ⓘ 热区 20×20（实 ' + A.w + '×' + A.h + '）');
ok(A.color === 'rgb(178, 178, 178)', 'A5 ⓘ 颜色 #B2B2B2（实 ' + A.color + '）');
ok(A.inBar, 'A6 ⓘ 未溢出标题栏');

console.log('\n===== B · 弹窗打开与结构 =====');
const before = await page.evaluate(() => getComputedStyle(document.getElementById('comm2HelpMask')).display);
await page.click('#comm2HelpBtn');
await sleep(400);
const B = await page.evaluate(() => {
  const mask = document.getElementById('comm2HelpMask');
  const dlg = mask.querySelector('.dialog');
  const dr = dlg.getBoundingClientRect();
  const lists = [...mask.querySelectorAll('.comm2-hint-list')];
  return {
    cls: mask.className,
    isHelpStyle: dlg.classList.contains('dialog--emp-help'),
    title: mask.querySelector('.dialog__title').textContent,
    hasScroll: !!mask.querySelector('.dialog__scroll.emp-help-body'),
    h4: [...mask.querySelectorAll('h4')].map((e) => e.textContent),
    listCount: lists.length,
    noPerList: lists.map((l) => l.querySelectorAll('.comm2-hint-item').length),
    nums: lists.map((l) => [...l.querySelectorAll('.comm2-hint-item__no')].map((n) => n.textContent)),
    allHaveTd: [...mask.querySelectorAll('.comm2-hint-item')].every((it) => it.querySelector('.comm2-hint-item__t') && it.querySelector('.comm2-hint-item__d')),
    okBtn: (mask.querySelector('#comm2HelpOk') || {}).textContent,
    dlgW: Math.round(dr.width), dlgH: Math.round(dr.height),
    ts: [...mask.querySelectorAll('.comm2-hint-item__t')].map((e) => e.textContent),
    ds: [...mask.querySelectorAll('.comm2-hint-item__d')].map((e) => e.textContent),
    text: mask.querySelector('.dialog__scroll').textContent,
  };
});
console.log(' ', JSON.stringify({ h4: B.h4, noPerList: B.noPerList, nums: B.nums, title: B.title }));
ok(/show/.test(B.cls), 'B1 点 ⓘ 后弹窗打开（.show）');
ok(before === 'none', 'B2 打开前弹窗不可见（display none，实 ' + before + '）');
ok(B.isHelpStyle && B.hasScroll, 'B3 复用 dialog--emp-help + dialog__scroll.emp-help-body');
ok(B.title === TITLE, 'B4 弹窗标题已改白话：「' + B.title + '」');
ok(B.h4.length === 2 && B.h4[0] === '一、谁能挂几个方案（2 条）' && B.h4[1] === '二、钱怎么算（5 条）', 'B5 两个分节标题：' + B.h4.join(' | '));
ok(B.listCount === 2 && B.noPerList[0] === 2 && B.noPerList[1] === 5, 'B6 条目数 2 + 5（实 ' + B.noPerList.join(' + ') + '）');
ok(JSON.stringify(B.nums[0]) === JSON.stringify(['1', '2']) && JSON.stringify(B.nums[1]) === JSON.stringify(['1', '2', '3', '4', '5']), 'B7 序号各自从 1 连续（与编辑页弹窗同约定）');
ok(B.allHaveTd, 'B8 每条都有「加粗结论 + 灰字补充」两段');
ok(B.okBtn === '知道了', 'B9 底部单按钮「知道了」');
ok(B.dlgW <= 390 && B.dlgH <= 880, 'B10 弹窗不超出视口（实 ' + B.dlgW + '×' + B.dlgH + '）');

console.log('\n===== C · 白话纯净度（不得出现内部术语与公式） =====');
const jargon = ['取高', '分摊', '覆盖', '分类默认', '订单行', '试算', '计提', '并列', '命中', '金额最大', '写入', '胜出', '适用范围', '÷', '×', '也在：'];
const hit = jargon.filter((w) => B.text.indexOf(w) >= 0);
ok(hit.length === 0, 'C1 弹窗正文无内部术语 / 公式（命中 ' + JSON.stringify(hit) + '）');
ok(B.text.indexOf('挑钱最多的那个给他') >= 0, 'C2 取高已白话为「挑钱最多的那个给他」');
ok(B.text.indexOf('排在前面那个方案说了算') >= 0, 'C3 并列按顺序已白话为「排在前面那个方案说了算」');
ok(B.text.indexOf('分开算完再加在一起') >= 0, 'C4 不同行相加已白话');
ok(B.ts.length === 7 && B.ts.every((t) => t.length > 0), 'C5 七条结论逐条就位（' + B.ts.length + ' 条）');

console.log('\n===== D · 排版与复用样式 =====');
const D = await page.evaluate(() => {
  const mask = document.getElementById('comm2HelpMask');
  const scroll = mask.querySelector('.dialog__scroll');
  const items = [...mask.querySelectorAll('.comm2-hint-item')];
  const noRects = [...mask.querySelectorAll('.comm2-hint-item__no')].map((n) => {
    const r = n.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), r: getComputedStyle(n).borderRadius, bg: getComputedStyle(n).backgroundColor, fs: getComputedStyle(n).fontSize, lh: getComputedStyle(n).lineHeight };
  });
  const t = mask.querySelector('.comm2-hint-item__t');
  const d = mask.querySelector('.comm2-hint-item__d');
  const first = items[0];
  const noR = first.querySelector('.comm2-hint-item__no').getBoundingClientRect();
  const txtR = first.querySelector('.comm2-hint-item__main').getBoundingClientRect();
  const h4R = mask.querySelector('h4').getBoundingClientRect();
  return {
    noAll: noRects.every((n) => n.w === 18 && n.h === 18 && n.r === '50%' && n.bg === 'rgb(240, 240, 240)' && n.fs === '11px' && n.lh === '18px'),
    overflowX: items.filter((it) => it.scrollWidth > it.clientWidth + 1).length,
    scrollable: getComputedStyle(scroll).overflowY,
    gap: Math.round(txtR.left - noR.right),
    noLeft: Math.round(noR.left), h4Left: Math.round(h4R.left),
    ttWeight: getComputedStyle(t).fontWeight, ttSize: getComputedStyle(t).fontSize, ttColor: getComputedStyle(t).color,
    ddSize: getComputedStyle(d).fontSize, ddColor: getComputedStyle(d).color,
  };
});
console.log(' ', JSON.stringify(D));
ok(D.ttWeight === '600' && D.ttSize === '13px' && D.ttColor === 'rgb(51, 51, 51)', 'D1 结论加粗 13px 主色（实 ' + D.ttWeight + ' / ' + D.ttSize + ' / ' + D.ttColor + '）');
ok(D.ddSize === '12px' && D.ddColor === 'rgb(146, 146, 146)', 'D2 补充灰字 12px #929292（实 ' + D.ddSize + ' / ' + D.ddColor + '）');
ok(D.noAll, 'D3 序号圆点 18×18 / 圆形 50% / #F0F0F0 / 11px 居中');
ok(D.overflowX === 0, 'D4 无条目横向溢出（实 ' + D.overflowX + ' 条）');
ok(D.scrollable === 'auto' || D.scrollable === 'scroll', 'D5 内容区可滚动（overflow-y: ' + D.scrollable + '）');
ok(D.gap === 8, 'D6 序号与文字间距 8px（实 ' + D.gap + '）');
ok(D.noLeft === D.h4Left, 'D7 序号与分节标题左对齐（' + D.noLeft + ' vs ' + D.h4Left + '）');

console.log('\n===== E · 关闭路径 =====');
await page.click('#comm2HelpOk');
await sleep(300);
const E1 = await page.evaluate(() => document.getElementById('comm2HelpMask').className);
ok(!/show/.test(E1), 'E1 点「知道了」关闭（实 "' + E1 + '"）');
await page.click('#comm2HelpBtn'); await sleep(300);
await page.evaluate(() => { document.getElementById('comm2HelpMask').click(); });
await sleep(300);
const E2 = await page.evaluate(() => document.getElementById('comm2HelpMask').className);
ok(!/show/.test(E2), 'E2 点遮罩空白关闭（实 "' + E2 + '"）');

console.log('\n===== F · 回归：编辑页弹窗与触发隔离 =====');
await page.evaluate(() => {
  const s = window.Comm2Demo.getSchemes();
  window.Comm2Demo.openEdit(s[0].id);
});
await sleep(500);
await page.click('#comm2EditHelpBtn');
await sleep(400);
const F = await page.evaluate(() => {
  const rule = document.getElementById('comm2RuleHelpMask');
  const lists = [...rule.querySelectorAll('.comm2-hint-list')];
  return {
    ruleShown: /show/.test(rule.className),
    listShown: /show/.test(document.getElementById('comm2HelpMask').className),
    ruleTitle: rule.querySelector('.dialog__title').textContent,
    ruleH4: [...rule.querySelectorAll('h4')].map((e) => e.textContent),
    ruleCounts: lists.map((l) => l.querySelectorAll('.comm2-hint-item').length),
    editLabel: document.getElementById('comm2EditHelpBtn').getAttribute('aria-label'),
  };
});
console.log(' ', JSON.stringify(F));
ok(F.ruleShown && !F.listShown, 'F1 编辑页 ⓘ 只开编辑页弹窗（未串到列表页弹窗）');
ok(F.ruleTitle === '提成怎么设、钱怎么算', 'F2 编辑页弹窗标题未受影响（' + F.ruleTitle + '）');
ok(F.ruleCounts[0] === 5 && F.ruleCounts[1] === 8, 'F3 编辑页弹窗条目仍为 5 + 8（实 ' + F.ruleCounts.join(' + ') + '）');
ok(F.ruleH4[0] === '一、怎么设置（5 步）' && F.ruleH4[1] === '二、钱怎么算出来（8 条）', 'F4 编辑页弹窗分节标题未受影响');
ok(F.editLabel === '提成怎么设置、钱怎么算', 'F5 编辑页 ⓘ aria-label 未被牵连修改（' + F.editLabel + '）');

console.log('\n===== 汇总：' + pass + ' PASS / ' + fail + ' FAIL =====');
await browser.close();
process.exit(fail ? 1 : 0);
