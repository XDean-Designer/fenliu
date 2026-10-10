// Probe DOM structure & natural full height for screens that overflow 844.
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
      // Identify vertical scroll containers inside the shown screen (overflow-y auto/scroll)
      const scrolls = [];
      const allEls = shown.querySelectorAll('*');
      allEls.forEach((el) => {
        const cs = getComputedStyle(el);
        if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
          scrolls.push({ cls: (el.className || '').toString().slice(0, 60), id: el.id, ch: el.clientHeight, sh: el.scrollHeight });
        }
      });
      // natural full height: unclamp all relevant nodes (html/body/frame/stage/screen + scroll containers)
      const walk = (el, keyTag) => {
        if (!el || el.nodeType !== 1) return;
        if (keyTag(el)) {
          const st = el.style;
          if (getComputedStyle(el).position === 'fixed') st.position = 'static';
          st.overflow = 'visible';
          st.height = 'auto';
          st.minHeight = '0';
          st.maxHeight = 'none';
        }
        Array.from(el.children).forEach((c) => walk(c, keyTag));
      };
      const isKey = (el) => ['BODY', 'HTML'].includes(el.tagName) || el.id === 'frame' || /stage|screen|phone|scroll|body-content|list/i.test(el.className || '');
      walk(document.body, isKey);
      const frame = document.getElementById('frame');
      const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { y: +r.y.toFixed(0), h: +r.height.toFixed(0) }; };
      let maxBottom = 0;
      const all = shown.querySelectorAll('*');
      all.forEach((el) => {
        if (el.getBoundingClientRect().bottom > maxBottom) maxBottom = el.getBoundingClientRect().bottom;
      });
      const frameRect = frame ? frame.getBoundingClientRect() : null;
      return {
        shownClass: shown.className,
        scrolls,
        naturalFrameH: frameRect ? +frameRect.height.toFixed(0) : null,
        docScrollH: document.documentElement.scrollHeight,
        contentMaxBottom: +maxBottom.toFixed(0),
        navVisible: getComputedStyle(document.querySelector('.site-nav')).display !== 'none',
      };
    });
    console.log('=== ' + key + ' ===');
    console.log(JSON.stringify(info, null, 1));
    await page.close();
  }
} finally {
  await browser.close();
}
