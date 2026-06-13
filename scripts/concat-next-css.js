/**
 * After `next build`, merges `.next/static/css/*.css` into `public/compiled-styles.css`.
 * Used when streamed HTML omits <link rel="stylesheet"> (some Docker/Linux builds).
 *
 * On linux/amd64 Docker, Next sometimes omits `.next/static/css` entirely or emits only
 * vendor chunks; we then run `tailwindcss` CLI against `app/globals.css`.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const cssDir = path.join(process.cwd(), ".next/static/css");
const outFile = path.join(process.cwd(), "public", "compiled-styles.css");
const MIN_MERGED_BYTES = 50_000;

function runTailwindCliFallback() {
  const tmpOut = path.join(os.tmpdir(), `tailwind-compiled-${process.pid}.css`);
  console.warn(
    "concat-next-css: running tailwindcss fallback (-i app/globals.css)",
  );
  execSync(`npx tailwindcss -i ./app/globals.css -o "${tmpOut}" --minify`, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });
  const css = fs.readFileSync(tmpOut, "utf8");
  try {
    fs.unlinkSync(tmpOut);
  } catch {
    /* ignore */
  }
  return css;
}

function readNextCssChunks() {
  if (!fs.existsSync(cssDir)) {
    console.warn("concat-next-css: .next/static/css not found (using tailwind fallback)");
    return "";
  }

  const files = fs.readdirSync(cssDir).filter((f) => f.endsWith(".css")).sort();
  if (files.length === 0) {
    console.warn("concat-next-css: no .css files under .next/static/css (using tailwind fallback)");
    return "";
  }

  let combined = "";
  for (const f of files) {
    const p = path.join(cssDir, f);
    const bytes = fs.readFileSync(p, "utf8");
    console.log(`concat-next-css: ${f} (${bytes.length} bytes)`);
    combined += (combined ? "\n" : "") + bytes;
  }
  return combined;
}

let combined = readNextCssChunks();

if (combined.length < MIN_MERGED_BYTES) {
  const tw = runTailwindCliFallback();
  combined = tw + (combined ? `\n${combined}` : "");
}

if (combined.length < MIN_MERGED_BYTES) {
  console.error(
    `concat-next-css: output still only ${combined.length} bytes (expected ≥ ${MIN_MERGED_BYTES}).`,
  );
  process.exit(1);
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, combined, "utf8");
console.log(`concat-next-css: wrote ${outFile} (${combined.length} bytes)`);
