import { existsSync } from 'node:fs';

const PORT = 8765;
const BASE = `http://127.0.0.1:${PORT}/index.html?view=desktop&capture=`;

let puppeteer;
try { puppeteer = await import('puppeteer-core'); } catch {
  const { createRequire } = await import('node:module');
  const { join } = await import('node:path');
  const req = createRequire(join('C:\\Users\\Administrator\\.cursor\\skills\\run-to-figma\\scripts', '_resolve.js'));
  const entry = req.resolve('puppeteer-core');
  puppeteer = await import('file:///' + entry.replaceAll('\\', '/').replace(/^\/([A-Za-z]):/, '$1:'));
}
const browserPath = [
  process.env.FIGMA_CAPTURE_BROWSER,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => p && existsSync(p));

const browser = await puppeteer.launch({ executablePath: browserPath, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
await page.goto(BASE + 'comm2-list', { waitUntil: 'load', timeout: 20000 });
await new Promise((r) => setTimeout(r, 2500));

// 通过真实 UI 打开「分配员工」Sheet，读出方案与已选员工
const info = await page.evaluate(() => {
  const cards = Array.from(document.querySelectorAll('#comm2List [data-comm2-card]'));
  return {
    cardAssignBtns: document.querySelectorAll('#comm2List [data-comm2-assign]').length,
    cards: cards.map((c) => ({
      name: (c.querySelector('.comm2-scheme-name, .comm2-name, h3, strong') || {}).textContent || '',
      assignAttr: (c.querySelector('[data-comm2-assign]') || {}).getAttribute
        ? c.querySelector('[data-comm2-assign]').getAttribute('data-comm2-assign') : null,
    })),
  };
});
console.log('=== list cards ===');
console.log(JSON.stringify(info, null, 2));

// 打开头一个分配 Sheet，看已勾选
const firstAssign = info.cards.find((c) => c.assignAttr);
if (firstAssign) {
  await page.evaluate((id) => {
    document.querySelector(`#comm2List [data-comm2-assign="${id}"]`).click();
  }, firstAssign.assignAttr);
  await new Promise((r) => setTimeout(r, 900));
  const sheet = await page.evaluate(() => {
    const root = document.getElementById('comm2AssignList') || document.getElementById('comm2AssignMask');
    const togs = Array.from(document.querySelectorAll('#comm2AssignList [data-comm2-assign-tog]'));
    return {
      sheetVisible: !!root && getComputedStyle(document.getElementById('comm2AssignMask')).display !== 'none',
      togs: togs.map((t) => t.getAttribute('data-comm2-assign-tog') + (t.classList.contains('on') ? ':on' : ':off')),
      clearBtn: !!document.querySelector('[data-comm2-assign-clear], #comm2AssignClear'),
      okBtn: !!document.getElementById('comm2AssignOk'),
      names: togs.map((t) => (t.textContent || '').trim().slice(0, 10)),
    };
  });
  console.log('=== assign sheet (' + firstAssign.assignAttr + ') ===');
  console.log(JSON.stringify(sheet, null, 2));
}

await browser.close();
