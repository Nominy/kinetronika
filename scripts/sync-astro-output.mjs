import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const distDir = path.join(rootDir, "dist");
const distIndex = path.join(distDir, "index.html");
const distAssets = path.join(distDir, "_astro");
const rootIndex = path.join(rootDir, "index.html");
const rootAssets = path.join(rootDir, "_astro");

function assertInsideRoot(targetPath) {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedTarget = path.resolve(targetPath);
  if (
    resolvedTarget !== resolvedRoot &&
    !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
    throw new Error(`Refusing to touch path outside workspace: ${resolvedTarget}`);
  }
  return resolvedTarget;
}

let html = await readFile(distIndex, "utf8");
html = html
  .replaceAll('href="/_astro/', 'href="_astro/')
  .replaceAll('src="/_astro/', 'src="_astro/')
  .replaceAll("url(/_astro/", "url(_astro/")
  .replaceAll("&#34;/_astro/", "&#34;_astro/")
  .replaceAll("&quot;/_astro/", "&quot;_astro/");

await writeFile(assertInsideRoot(rootIndex), html, "utf8");
await rm(assertInsideRoot(rootAssets), { recursive: true, force: true });
await mkdir(assertInsideRoot(rootAssets), { recursive: true });
await cp(assertInsideRoot(distAssets), assertInsideRoot(rootAssets), {
  recursive: true,
});

console.log("Synced Astro landing output to index.html and _astro/.");
