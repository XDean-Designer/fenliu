// Sample shell geometry over time for the tall routes to find settling point.
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
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ['emp-salary-detail'];
const browser = await puppeteer.default.launch({ executablePath: exe, headless: true, args: ['--no-sandbox'] });
try {
  for (const key of targets) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    const url = `http://127.0.0.1:8765/index.html?view=desktop&capture=${key}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    const samples = [];
    for (let i = 0; i <= 12; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const s = await page.evaluate(() => {
        const st = document.getElementById('frame');
        const stage = document.querySelector('.stage');
        const cur = document.querySelector('.screen:not(.hidden)') || document.querySelector('.screen.show');
        const scroller = cur ? cur.querySelector('[style*="overflow"], .scroll-area, [data-scroll]') : null;
        const r = st ? st.getBoundingClientRect() : null;
        return {
          frameH: r ? +r.height.toFixed(1) : null,
          frameScrollH: st ? st.scrollHeight : null,
          docScrollH: document.documentElement.scrollHeight,
          stageH: stage ? +stage.getBoundingClientRect().height.toFixed(1) : null,
          curScrollH: cur ? cur.scrollHeight : null,
          listItemCount: cur ? cur.querySelectorAll('.list-item, .cell, .salary-row, [class*="row"], [class*="item"]').length : null,
        };
      });
      samples.push((i * 500) + 'ms ' + JSON.stringify(s));
    }
    console.log('=== ' + key + ' ===');
    console.log(samples.join('\n'));
    await page.close();
  }
} finally {
  await browser.close();
}
