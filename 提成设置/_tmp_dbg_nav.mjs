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

for (const q of ['?view=desktop', '']) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 880, deviceScaleFactor: 2 });
  await page.goto(base + q, { waitUntil: 'load', timeout: 30000 });
  await sleep(1200);
  const info = await page.evaluate(() => {
    const nav = document.querySelector('.site-nav');
    const app = document.querySelector('.app') || document.querySelector('#app') || document.body.firstElementChild;
    const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { l: Math.round(b.left), t: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height), z: getComputedStyle(el).zIndex, disp: getComputedStyle(el).display }; };
    return { nav: r(nav), app: r(app), navDisplay: nav ? getComputedStyle(nav).display : 'none' };
  });
  console.log(q || '(no query)', '=>', JSON.stringify(info));
  await page.close();
}
await browser.close();
