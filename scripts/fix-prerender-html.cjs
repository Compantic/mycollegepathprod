/**
 * Linux `next build` can emit app-route *.html files without a leading document shell.
 * Browsers then parse invalid markup and React hydration fails (#418/#423, HierarchyRequestError).
 * Prepends a shell that matches app/layout.tsx when the file does not start with <!DOCTYPE or <html>.
 *
 * `next build` also writes a copy under `.next/standalone/.next/server/app` for `output: "standalone"`.
 * This script runs *after* `next build`; it must patch both trees. Docker only copies `standalone/`,
 * so if we only fix `.next/server/app`, production still serves the broken fragment HTML (no CSS in Safari).
 */
const fs = require("fs");
const path = require("path");

const ROOTS = [
  path.join(process.cwd(), ".next/server/app"),
  path.join(process.cwd(), ".next/standalone/.next/server/app"),
].filter((d) => fs.existsSync(d));

/** Must stay in sync with app/layout.tsx production <head> + <body className>. */
const SHELL_PREFIX = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/><link rel="stylesheet" href="/app-shell-layout.css"/><link rel="stylesheet" href="/compiled-styles.css"/></head><body class="min-h-screen bg-[#F7F9FC] font-sans antialiased bg-pattern bg-glow">`;

function walkHtmlFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkHtmlFiles(p, out);
    else if (ent.name.endsWith(".html")) out.push(p);
  }
  return out;
}

function needsShell(content) {
  const t = content.trimStart();
  const lower = t.slice(0, 32).toLowerCase();
  return !(lower.startsWith("<!doctype") || lower.startsWith("<html"));
}

function main() {
  let n = 0;
  for (const root of ROOTS) {
    const files = walkHtmlFiles(root);
    for (const file of files) {
      const c = fs.readFileSync(file, "utf8");
      if (!needsShell(c)) continue;
      fs.writeFileSync(file, SHELL_PREFIX + c, "utf8");
      n += 1;
      console.log("fix-prerender-html:", path.relative(process.cwd(), file));
    }
  }
  if (n) console.log("fix-prerender-html: prepended document shell to", n, "file(s)");
}

main();
