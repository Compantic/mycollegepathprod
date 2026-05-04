import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resolves a file under `public/` at runtime in dev, Docker standalone, and varied cwd layouts.
 */
export function resolvePublicFile(fileName: string): string | null {
  const candidates: string[] = [];
  const cwd = process.cwd();

  /** Azure/Dockerfile layout: WORKDIR /app, COPY public → /app/public (absolute path is most reliable). */
  if (process.env.NODE_ENV === "production") {
    candidates.push(path.join("/app", "public", fileName));
  }
  candidates.push(path.join(cwd, "public", fileName));
  candidates.push(path.join(cwd, "..", "public", fileName));
  candidates.push(path.join(cwd, "..", "..", "public", fileName));

  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    let dir = here;
    for (let i = 0; i < 16; i++) {
      candidates.push(path.join(dir, "public", fileName));
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch {
    /* import.meta.url unavailable in some runners */
  }

  const tried = new Set<string>();
  for (const p of candidates) {
    if (tried.has(p)) continue;
    tried.add(p);
    try {
      if (fs.existsSync(p) && fs.statSync(p).size > 0) return p;
    } catch {
      /* try next */
    }
  }

  if (process.env.NODE_ENV === "production") {
    console.error(`resolvePublicFile: missing public/${fileName} (tried ${tried.size} path(s))`);
  }
  return null;
}
