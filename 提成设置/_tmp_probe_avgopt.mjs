/** 校验 staff-pick-avg-expand：展开态应出现「服务提成」+「顾客指定」两张选项卡。 */
import { existsSync } from 'node:fs';

const BASE = 'http://127.0.0.1:8765/index.html?capture=';
let puppeteer;
const skillRoot = process.env.SKILL_DIR || 'C:\\Users\\Administrator\\.cursor\\skills\\run-to-figma';
try { puppeteer = await import('puppeteer-core'); } catch {
  const { createRequire } = await import('node:module');
  const { join } = await import('node:path');
  const req = createRequire(join(skillRoot, 'scripts', '_resolve.js'));
  puppeteer = await import('file:///' + req.resolve('puppeteer-core').replaceAll('\\', '/').replace(/^\/([A-Za-z]):/, '$1:'));
}
const browserPath = [
  process.env.FIGMA_CAPTURE_BROWSER,
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => p && existsSync(p));

const browser = await puppeteer.launch({ executablePath: browserPath, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });

for (const route of ['staff-pick-avg-expand', 'staff-pick-avg', 'staff-pick-sel']) {
  await page.goto(BASE + route, { waitUntil: 'load', timeout: 20000 });
  await new Promise((r) => setTimeout(r, 3000));
  const out = await page.evaluate(() => {
    const opts = [];
    document.querySelectorAll('#comm2StaffSheetRoot [data-staff-opt]').forEach((el) => {
      opts.push({ key: el.getAttribute('data-staff-opt'), label: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 20) });
    });
    // demo 头部两个开关的激活态
    const toggles = [];
    document.querySelectorAll('[data-sp-mode],[data-sp-extra]').forEach((el) => {
      toggles.push((el.getAttribute('data-sp-mode') || el.getAttribute('data-sp-extra')) + '=' + (el.classList.contains('is-on') || el.getAttribute('aria-pressed') === 'true'));
    });
    const done = document.querySelector('#comm2StaffSheetDone');
    const summary = (document.querySelector('#comm2SpSummary') ? document.querySelector('#comm2SpSummary').textContent : '').replace(/\s+/g, ' ').trim().slice(0, 40);
    return { optCount: opts.length, opts, toggles, sheetOpen: !!(document.querySelector('#comm2StaffSheetRoot') && document.querySelector('#comm2StaffSheetRoot').offsetParent !== null), doneVisible: !!done, summary };
  });
  console.log(route.padEnd(22), JSON.stringify(out));
}

await browser.close();
