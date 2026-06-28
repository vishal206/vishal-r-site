import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

// Generates public/og-default.png — the social-share card used for the home page
// and as the fallback image for posts that have no image of their own.
// Re-run with `npm run generate-og` if the logo or branding changes.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const LOGO_PATH =
  "M354.571 67.1502V75.677C348.034 78.8035 340.928 85.0565 333.254 94.436C325.58 103.531 318.474 117.174 311.937 135.365L228.8 369C225.389 368.716 221.694 368.574 217.715 368.574C214.02 368.289 210.183 368.147 206.204 368.147C202.509 368.147 198.672 368.289 194.693 368.574C190.998 368.574 187.445 368.716 184.034 369L72.3327 102.963C68.3535 93.0149 64.0901 86.0513 59.5424 82.0721C55.279 78.0929 51.1577 75.9612 47.1785 75.677V67.1502C57.4107 67.4344 69.3483 67.7186 82.9912 68.0028C96.9184 68.2871 110.846 68.4292 124.773 68.4292C139.268 68.4292 152.911 68.2871 165.702 68.0028C178.492 67.7186 188.724 67.4344 196.398 67.1502V75.677C187.587 75.9612 180.623 76.956 175.507 78.6614C170.391 80.3667 167.407 83.7775 166.554 88.8936C165.986 93.7254 167.691 101.257 171.67 111.49L248.412 300.359L238.18 313.576L286.783 177.146C295.594 152.134 300.283 132.38 300.852 117.885C301.42 103.105 298.578 92.4464 292.325 85.9092C286.072 79.3719 277.261 75.9612 265.892 75.677V67.1502C276.692 67.4344 286.214 67.7186 294.457 68.0028C302.983 68.2871 312.079 68.4292 321.743 68.4292C327.427 68.4292 333.254 68.2871 339.223 68.0028C345.191 67.7186 350.307 67.4344 354.571 67.1502Z";

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px;
    background: #111111;
    display: flex; align-items: center; justify-content: center;
  }
  .logo { height: 340px; width: auto; }
</style></head><body>
  <svg class="logo" viewBox="0 0 395 420" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="${LOGO_PATH}" fill="#4ade80"/>
  </svg>
</body></html>`;

const run = async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: "networkidle0" });
  const out = path.join(root, "public", "og-default.png");
  await page.screenshot({ path: out, type: "png" });
  await browser.close();
  console.log(`Generated ${out}`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
