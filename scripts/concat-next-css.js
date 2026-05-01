/**
 * After `next build`, merges `.next/static/css/*.css` into `public/compiled-styles.css`.
 * Used when streamed HTML omits <link rel="stylesheet"> (some Docker/Linux builds).
 */
const fs = require("fs");
const path = require("path");

const cssDir = path.join(process.cwd(), ".next/static/css");
const outFile = path.join(process.cwd(), "public/compiled-styles.css");

if (!fs.existsSync(cssDir)) {
  console.error("concat-next-css: missing directory .next/static/css");
  process.exit(1);
}

const files = fs.readdirSync(cssDir).filter((f) => f.endsWith(".css")).sort();
if (files.length === 0) {
  console.error("concat-next-css: no .css files under .next/static/css");
  process.exit(1);
}

const combined = files.map((f) => fs.readFileSync(path.join(cssDir, f), "utf8")).join("\n");
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, combined, "utf8");
console.log(`concat-next-css: wrote ${outFile} (${files.length} file(s))`);
