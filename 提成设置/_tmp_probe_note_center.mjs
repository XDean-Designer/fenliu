/* 探针：改动重算弹窗「提示信息」水平居中（三十一次后补） */
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
await page.addStyleTag({ content: '.site-nav { display: none !important; }' });
await sleep(1600);

const target = await page.evaluate(() => {
  const list = window.Comm2Demo.getSchemes();
  const s = list.find((x) => (x.assigneeIds || []).length > 0);
  return s ? s.id : null;
});
ok(!!target, '存在已分配员工的方案');

/* 改一个影响金额的字段 → 保存 → 弹窗 */
await page.evaluate((id) => { window.Comm2Demo.openEdit(id); }, target);
await sleep(500);
await page.evaluate(() => {
  const c = document.querySelector('#comm2EditCards [data-comm2-card-base="paid"]');
  if (c) c.click();
});
await sleep(260);
await page.click('#comm2BtnSave');
await sleep(600);

const m = await page.evaluate(() => {
  const mask = document.getElementById('comm2RecalcMask');
  const shown = mask && mask.classList.contains('show');
  const n = mask?.querySelector('.comm2-recalc__note');
  if (!shown || !n) return { err: '弹窗或提示未出现', shown: !!shown, note: !!n };
  const cs = getComputedStyle(n);
  const body = n.parentElement.getBoundingClientRect();
  const ico = n.querySelector('.comm2-recalc__note-ico').getBoundingClientRect();
  const txt = n.querySelector('span:not(.comm2-recalc__note-ico)');
  const tb = txt.getBoundingClientRect();
  return {
    justify: cs.justifyContent, textAlign: cs.textAlign,
    bodyW: +body.width.toFixed(2),
    gapLeft: +(ico.left - body.left).toFixed(2),
    gapRight: +(body.right - tb.right).toFixed(2),
    centerDelta: +(((ico.left + tb.right) / 2) - ((body.left + body.right) / 2)).toFixed(2),
    rows: tb.height > 0 ? Math.round(n.getBoundingClientRect().height / 17) : 0,
    label: txt.textContent.trim(),
    textLeft: +tb.left.toFixed(2), textRight: +tb.right.toFixed(2),
    icoLeft: +ico.left.toFixed(2),
  };
});
console.log('  · ' + JSON.stringify(m, null, 0));
ok(m.justify === 'center', 'A1 提示行 justify-content = center（实际 ' + m.justify + '）');
ok(m.textAlign === 'center', 'A2 提示行 text-align = center（实际 ' + m.textAlign + '）');
ok(Math.abs(m.centerDelta) <= 1, 'A3 图标+文字整体水平居中（偏离中心 ' + m.centerDelta + 'px）');
ok(m.label === '已经手工改过的订单，金额不受影响。', 'A4 文案逐字一致');
ok(m.rows === 1, 'A5 单行不折行（行数 ' + m.rows + '）');

console.log('\n================ ' + pass + ' PASS / ' + fail + ' FAIL ================');
await browser.close();
process.exit(fail ? 1 : 0);
