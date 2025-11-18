import puppeteer from 'puppeteer';
import fs from 'node:fs';

const URL = process.env.APP_URL || 'http://localhost:8080';
const OUT_DIR = process.env.OUT_DIR || 'public/screenshots';
const LABEL = process.env.LABEL || 'before';

const VIEWPORTS = [
  { w: 360, h: 740, name: '360x740' },
  { w: 375, h: 812, name: '375x812' },
  { w: 412, h: 915, name: '412x915' },
  { w: 768, h: 1024, name: '768x1024' }
];

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`Server not reachable at ${url} within ${timeoutMs}ms`);
}

async function main() {
  const target = `${URL}/`;
  const dest = `${OUT_DIR}/${LABEL}`;
  fs.mkdirSync(dest, { recursive: true });

  await waitForServer(target);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  for (const v of VIEWPORTS) {
    await page.setViewport({ width: v.w, height: v.h, deviceScaleFactor: 1 });
    await page.goto(target, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForTimeout(800);
    const file = `${dest}/home-${v.name}.png`;
    await page.screenshot({ path: file, fullPage: false });
    console.log(`Saved ${file}`);
  }

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
