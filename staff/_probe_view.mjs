let puppeteer;
const skillRoot = 'C:/Users/Administrator/.cursor/skills/run-to-figma';
try {
  puppeteer = await import('puppeteer-core');
} catch {
  const { createRequire } = await import('node:module');
  const req = createRequire(skillRoot + '/scripts/_resolve.js');
  const entry = req.resolve('puppeteer-core');
  puppeteer = await import('file:///' + entry.replaceAll('\\', '/').replace(/^\/([A-Za-z]):/, '$1:'));
}
const exe = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const url = process.argv[2] || 'http://127.0.0.1:8765/index.html?view=desktop&capture=hub';
const browser = await puppeteer.default.launch({ executablePath: exe, headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));
  const info = await page.evaluate(() => {
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const st = document.querySelector('.status-bar');
    const frame = document.getElementById('frame');
    const hub = document.getElementById('screen-hub');
    return {
      htmlClass: document.documentElement.className,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      frame: rect(frame),
      frameOverflow: frame ? getComputedStyle(frame).overflow : null,
      frameDisplay: frame ? getComputedStyle(frame).display : null,
      statusBar: rect(st),
      statusBarDisplay: st ? getComputedStyle(st).display : null,
      statusTime: st ? (st.querySelector('.status-bar__time') || {}).textContent : null,
      hubShown: hub ? !hub.classList.contains('hidden') : null,
      navShown: getComputedStyle(document.querySelector('.site-nav')).display,
      stageRect: rect(document.querySelector('.stage')),
      docScroll: { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight },
      viewport: { w: window.innerWidth, h: window.innerHeight }
    };
  });
  console.log(JSON.stringify(info, null, 2));
} finally {
  await browser.close();
}
