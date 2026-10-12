// Detect bottom-fixed elements (sticky action bars / tab bars / footers) within each screen,
// and measure the natural scrollHeight of the page-body scroll container.
let puppeteer;
const skillRoot = 'C:/Users/Administrator/.cursor/skills/run-to-figma';
try {
  puppeteer = await import('puppeteer-core');
} catch {
  const { createRequire } = await import('node:module');
  const { join } = await import('node:path');
  const req = createRequire(join(skillRoot, 'scripts', '_resolve.js'));
  const entry = req.resolve('puppeteer-core');
  puppeteer = await import('file:///' + entry.replaceAll('\\', '/').replace(/^\/([A-Za-z]):/, '$1:'));
}
const exe = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const keys = process.argv.slice(2);
const browser = await puppeteer.default.launch({ executablePath: exe, headless: true, args: ['--no-sandbox'] });
try {
  for (const key of keys) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    const url = `http://127.0.0.1:8765/index.html?view=desktop&capture=${key}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2200));
    const info = await page.evaluate(() => {
      const screens = [...document.querySelectorAll('.screen')];
      const shown = screens.find((s) => !s.classList.contains('hidden'));
      if (!shown) return { error: 'no screen' };
      const body = shown.querySelector('.page-body');
      const fixed = [];
      shown.querySelectorAll('*').forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' || cs.position === 'sticky') {
          const r = el.getBoundingClientRect();
          fixed.push({ cls: (el.className || '').toString().slice(0, 50), pos: cs.position, bottom: +r.bottom.toFixed(0), top: +r.top.toFixed(0), h: +r.height.toFixed(0) });
        }
      });
      return {
        body: body ? { ch: body.clientHeight, sh: body.scrollHeight } : null,
        fixed,
      };
    });
    console.log(JSON.stringify(info));
    await page.close();
  }
} finally {
  await browser.close();
}
