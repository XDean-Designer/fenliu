import fs from 'node:fs';
import { existsSync } from 'node:fs';

const MANIFEST = JSON.parse(fs.readFileSync(process.argv[2] || 'figma-capture.manifest.json', 'utf8'));
const PORT = 8765;
const BASE = `http://127.0.0.1:${PORT}/index.html?view=desktop&capture=`;

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
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => p && existsSync(p));
if (!browserPath) { console.error('no browser'); process.exit(1); }

const browser = await puppeteer.launch({ executablePath: browserPath, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

const report = [];
for (const s of MANIFEST.screens) {
  const url = BASE + s.capture;
  let out;
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 20000 });
    await new Promise((r) => setTimeout(r, s.delay || 1500));
    out = await page.evaluate(() => {
      const root = document.querySelector('#frame');
      if (!root) return { err: 'no #frame' };
      const visibleScreens = [];
      root.querySelectorAll('.screen').forEach((el) => {
        if (!el.classList.contains('hidden')) visibleScreens.push(el.id);
      });
      const overlays = [];
      root.querySelectorAll('*').forEach((el) => {
        const cls = String(el.className || '');
        const id = el.id || '';
        if (!cls.includes('mask') && !/Mask|Sheet|Dialog|Picker/.test(id)) return;
        if (cls.includes('hidden')) return;
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) return;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return;
        overlays.push(id ? '#' + id : '.' + cls.split(' ')[0]);
      });
      const counts = {
        staffCards: root.querySelectorAll('.emp-salary-card').length,
        salaryCells: root.querySelectorAll('#empSalaryList [data-detail-kind]').length,
        salaryDetailRows: root.querySelectorAll('#empSalaryDetailBody [data-comm-line], #empSalaryDetailBody [data-comm-edit]').length,
        editLines: root.querySelectorAll('#empSalaryDetailBody [data-comm-edit]').length,
        commEditCards: root.querySelectorAll('#comm2EditCards .comm2-rule-card, #comm2EditCards [class*="comm2-rule"]').length,
        schemeCards: root.querySelectorAll('#comm2List [data-comm2-card]').length,
        staffRows: root.querySelectorAll('#empListRoot [data-staff-id]').length,
        detailChips: root.querySelectorAll('[data-emp-status-chip]').length,
        rewardRows: root.querySelectorAll('#empSalaryList [data-detail-kind="reward"]').length,
        keypad: !!document.querySelector('#amountKeypadMask.open, #amountKeypadMask.show')
      };
      return {
        err: null,
        screens: visibleScreens,
        overlays: overlays.slice(0, 12),
        counts
      };
    });
  } catch (e) {
    out = { err: String(e && e.message || e), screens: [], overlays: [] };
  }
  report.push({ capture: s.capture, name: s.name, out });
  const line = out.err
    ? `FAIL ${s.capture} ${out.err}`
    : `OK   ${s.capture.padEnd(22)} screens=[${out.screens.join(',')}] overlays=[${out.overlays.join(',')}]`;
  console.log(line);
}

await browser.close();
fs.writeFileSync('_capture_verify_result.json', JSON.stringify(report, null, 2));
console.log('\nfull json -> _capture_verify_result.json');
