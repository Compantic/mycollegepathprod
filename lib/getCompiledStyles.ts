import fs from "node:fs";
import { resolvePublicFile } from "@/lib/resolvePublicPath";

/**
 * Reads merged Tailwind/CSS from post-build concat. No module-level cache:
 * during `next build` the file may not exist yet (concat runs after `next build`);
 * caching empty output would keep staging HTML without `<style>` forever.
 */
export function getCompiledStyles(): string {
  const file = resolvePublicFile("compiled-styles.css");
  if (!file) return "";
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}
