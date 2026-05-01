/**
 * linux/amd64 Docker builds can emit prerendered *.html without <!DOCTYPE>/<html>
 * (fragment-only). Safari then shows a blank page; Chrome is more forgiving.
 * Wrap those files after `next build` so standalone serves a valid document.
 */
const fs = require("fs");
const path = require("path");

/** Both trees exist with `output: "standalone"`; Docker copies `.next/standalone` only — wrap both after build. */
const roots = [
  path.join(process.cwd(), ".next", "server", "app"),
  path.join(process.cwd(), ".next", "standalone", ".next", "server", "app"),
].filter((p) => fs.existsSync(p));

if (roots.length === 0) {
  console.warn("wrap-prerender-html: no prerender app dirs — skip");
  process.exit(0);
}

function walkHtmlFiles(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkHtmlFiles(p, out);
    else if (ent.name.endsWith(".html")) out.push(p);
  }
  return out;
}

function needsWrap(content) {
  const s = content.trimStart();
  if (!s) return false;
  return !s.startsWith("<!DOCTYPE") && !s.startsWith("<!doctype");
}

function wrapDocument(inner) {
  return `<!DOCTYPE html>\n<html lang="en">\n${inner.trimEnd()}\n</html>\n`;
}

let wrapped = 0;
for (const root of roots) {
  for (const file of walkHtmlFiles(root)) {
    const raw = fs.readFileSync(file, "utf8");
    if (!needsWrap(raw)) continue;
    fs.writeFileSync(file, wrapDocument(raw), "utf8");
    wrapped += 1;
    console.log("wrap-prerender-html:", path.relative(process.cwd(), file));
  }
}

console.log(`wrap-prerender-html: wrapped ${wrapped} file(s)`);
