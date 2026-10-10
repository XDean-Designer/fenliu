import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
const skillRoot = 'C:\\Users\\Administrator\\.cursor\\skills\\run-to-figma';
let puppeteer;
try { puppeteer = await import('puppeteer-core'); }
catch {
  const req = createRequire(join(skillRoot, 'scripts', '_resolve.js'));
  const e = req.resolve('puppeteer-core');
  puppeteer = await import('file:///' + e.replaceAll('\\', '/').replace(/^\/([A-Za-z]):/, '$1:'));
}
const browserPath = [
  process.env.FIGMA_CAPTURE_BROWSER,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => p && existsSync(p));
const base = 'file:///D:/RTB%E6%89%93%E8%A1%A5%E4%B8%81%E5%B7%A5%E7%A8%8B/%E6%8F%90%E6%88%90%E8%AE%BE%E7%BD%AE/index.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: browserPath, headless: 'new' });

for (const [route, file] of [['comm2-recalc', '_shot_recalc.png']]) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 880, deviceScaleFactor: 2 });
  await page.goto(base + '?view=desktop&capture=' + route, { waitUntil: 'load', timeout: 30000 });
  await page.addStyleTag({ content: '.site-nav { display: none !important; }' });
  await sleep(2400);
  const mask = await page.$('#comm2RecalcMask .dialog');
  await mask.screenshot({ path: file });
  console.log('saved', file);
  await page.close();
}
await browser.close();
