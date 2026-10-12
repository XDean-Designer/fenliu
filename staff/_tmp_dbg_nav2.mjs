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

for (const w of [390, 1100]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: 880, deviceScaleFactor: 1 });
  await page.goto(base + '?view=desktop', { waitUntil: 'load', timeout: 30000 });
  await sleep(1200);
  await page.evaluate(() => { window.Comm2Demo.openList(); window.Comm2Demo.openEdit(window.Comm2Demo.getSchemes()[0].id); });
  await sleep(500);
  await page.evaluate(() => { const b = document.querySelector('#comm2EditCards [data-comm2-card-open]'); if (b) b.click(); });
  await sleep(600);
  const m = await page.evaluate(() => {
    const nav = document.querySelector('.site-nav');
    const body = document.getElementById('comm2CatSheetBody');
    const phone = document.querySelector('#screen-comm2-edit').closest('.app, .phone, .frame, #app, body > *');
    const b = document.querySelector('#comm2CatSheetBody [data-comm2-sheet-help="base"]');
    const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), z: getComputedStyle(el).zIndex }; };
    const br = b.getBoundingClientRect();
    const cx = br.left + br.width / 2, cy = br.top + br.height / 2;
    const top = document.elementFromPoint(cx, cy);
    return {
      nav: R(nav), sheetBody: R(body), btn: R(b),
      topTag: top && top.tagName, topCls: top && (typeof top.className === 'string' ? top.className : '(svg)'),
      hitIsBtn: top ? (top === b || b.contains(top)) : null,
      tagOfPhone: phone ? phone.tagName + '.' + phone.className : null,
    };
  });
  console.log('viewport', w, '=>', JSON.stringify(m));
  try {
    await page.click('#comm2CatSheetBody [data-comm2-sheet-help="base"]');
    await sleep(300);
    console.log('   mouse click ->', await page.evaluate(() => document.getElementById('comm2BaseHelpMask').className));
  } catch (e) { console.log('   mouse click FAILED:', e.message.split('\n')[0]); }
  await page.close();
}
await browser.close();
