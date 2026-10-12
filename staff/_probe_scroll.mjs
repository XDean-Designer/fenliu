// Probe scroll/overflow geometry for specific capture routes in desktop 390x844 mode.
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
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ['emp-salary'];
const browser = await puppeteer.default.launch({ executablePath: exe, headless: true, args: ['--no-sandbox'] });
try {
  for (const key of targets) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    const url = `http://127.0.0.1:8765/index.html?view=desktop&capture=${key}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2500));
    const info = await page.evaluate(() => {
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
      };
      const st = document.getElementById('frame');
      const pi = document.querySelector('.phone-inner.phone');
      const stage = document.querySelector('.stage');
      const cs = (el) => el ? getComputedStyle(el) : null;
      const cur = document.querySelector('.screen:not(.hidden)') || document.querySelector('.screen.show');
      return {
        url: location.href,
        htmlClass: document.documentElement.className,
        frame: rect(st),
        frameOv: cs(st) ? cs(st).overflow + '/' + cs(st).overflowY : null,
        frameScrollH: st ? st.scrollHeight : null,
        pi: rect(pi),
        piOv: cs(pi) ? cs(pi).overflow + '/' + cs(pi).overflowY : null,
        piScrollH: pi ? pi.scrollHeight : null,
        stage: rect(stage),
        stageOv: cs(stage) ? cs(stage).overflow + '/' + cs(stage).overflowY : null,
        curClass: cur ? cur.className : null,
        docScrollH: document.documentElement.scrollHeight,
        bodyScrollH: document.body.scrollHeight,
      };
    });
    console.log('=== ' + key + ' ===');
    console.log(JSON.stringify(info, null, 1));
    await page.close();
  }
} finally {
  await browser.close();
}
