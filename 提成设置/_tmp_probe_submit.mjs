/**
 * 诊断：captureForDesign 在失败路由上卡在哪一步。
 * 手法：用「假 captureId」调用，观察 capture.js 的 console 日志与网络请求。
 * 序列化在本地完成、submit 才发网络请求 —— 若卡在序列化，日志会停在早期阶段；
 * 若能走到上传，则说明序列化 OK，问题在 submit 之后。
 */
import { existsSync } from 'node:fs';

const PORT = 8765;
const BASE = `http://127.0.0.1:${PORT}/index.html?capture=`;
const DUMMY = '00000000-0000-0000-0000-000000000000';
const CAPTURE_JS_URL = 'https://mcp.figma.com/mcp/html-to-design/capture.js';

let puppeteer;
const skillRoot = process.env.SKILL_DIR || 'C:\\Users\\Administrator\\.cursor\\skills\\run-to-figma';
try {
  puppeteer = await import('puppeteer-core');
} catch {
  const { createRequire } = await import('node:module');
  const { join } = await import('node:path');
  const req = createRequire(join(skillRoot, 'scripts', '_resolve.js'));
  const entry = req.resolve('puppeteer-core');
  puppeteer = await import('file:///' + entry.replaceAll('\\', '/').replace(/^\/([A-Za-z]):/, '$1:'));
}

const browserPath = [
  process.env.FIGMA_CAPTURE_BROWSER,
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => p && existsSync(p));
if (!browserPath) { console.error('no browser'); process.exit(1); }

const scriptText = await (await fetch(CAPTURE_JS_URL)).text();
console.log('capture.js bytes =', scriptText.length);

const ROUTES = ['staff-pick-sheet', 'staff-pick-edit', 'staff-pick-avg', 'staff-pick-direct', 'staff-pick-sel'];

const browser = await puppeteer.launch({ executablePath: browserPath, headless: true });

for (const route of ROUTES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 });
  const events = [];
  page.on('console', (m) => events.push('LOG ' + m.text().slice(0, 200)));
  page.on('pageerror', (e) => events.push('ERR ' + String(e.message).slice(0, 200)));
  page.on('requestfailed', (r) => events.push('REQFAIL ' + r.url().slice(0, 90) + ' :: ' + (r.failure() ? r.failure().errorText : '')));
  page.on('response', (r) => {
    const u = r.url();
    if (u.indexOf('mcp.figma.com') >= 0) events.push('RESP ' + r.status() + ' ' + u.slice(0, 90));
  });

  const t0 = Date.now();
  await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 3200));
  await page.evaluate((s) => {
    const el = document.createElement('script');
    el.textContent = s;
    document.head.appendChild(el);
  }, scriptText);
  await page.waitForFunction(() => window.figma && typeof window.figma.captureForDesign === 'function', { timeout: 30000 });

  const started = Date.now();
  let result = 'PENDING';
  try {
    const r = await Promise.race([
      page.evaluate(
        ({ captureId, endpoint, selector }) => window.figma.captureForDesign({ captureId, endpoint, selector }),
        { captureId: DUMMY, endpoint: `https://mcp.figma.com/mcp/capture/${DUMMY}/submit?bindVariables=true`, selector: '#frame' }
      ),
      new Promise((res) => setTimeout(() => res('__TIMEOUT__'), 100000)),
    ]);
    result = r === '__TIMEOUT__' ? 'TIMEOUT_100s' : 'RETURNED:' + String(r).slice(0, 160);
  } catch (e) {
    result = 'THREW: ' + String(e.message).slice(0, 160);
  }
  const dt = Date.now() - started;
  console.log('\n=== ' + route + '  (call ' + dt + 'ms, total ' + (Date.now() - t0) + 'ms)');
  console.log('    result: ' + result);
  events.slice(-14).forEach((e) => console.log('    ' + e));
  await page.close();
}

await browser.close();
