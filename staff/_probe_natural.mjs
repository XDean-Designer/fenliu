// Measure NATURAL content height of each screen route: temporarily remove height clamps
// on html/body/#frame/.stage/.screen tree, then report document scroll height.
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
      const walk = (el) => {
        if (!el || el.nodeType !== 1) return;
        const st = el.style;
        const isKey = ['BODY', 'HTML'].includes(el.tagName) || el.id === 'frame' || /stage|screen|phone|viewport/i.test(el.className || '');
        if (isKey) {
          if (getComputedStyle(el).position === 'fixed') st.position = 'static';
          st.overflow = 'visible';
          st.height = 'auto';
          st.minHeight = '0';
          st.maxHeight = 'none';
        }
        Array.from(el.children).forEach(walk);
      };
      walk(document.body);
      const frame = document.getElementById('frame');
      const screens = [...document.querySelectorAll('.screen')];
      const shown = screens.find((s) => !s.classList.contains('hidden'));
      let maxBottom = 0;
      const all = (document.querySelectorAll('.screen *'));
      all.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom > maxBottom) maxBottom = r.bottom;
      });
      return {
        docScrollH: document.documentElement.scrollHeight,
        bodyScrollH: document.body.scrollHeight,
        frameRectH: frame ? +frame.getBoundingClientRect().height.toFixed(0) : null,
        maxBottom: +maxBottom.toFixed(0),
        shownClass: shown ? shown.className : null,
      };
    });
    console.log(key, JSON.stringify(info));
    await page.close();
  }
} finally {
  await browser.close();
}
