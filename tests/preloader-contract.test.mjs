import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const files = {
  indexSource: await readFile("src/pages/index.astro", "utf8"),
  cfnf: await readFile("cfnf.html", "utf8"),
  printer: await readFile("printer.html", "utf8"),
  preloader: await readFile("assets-preloader.js", "utf8").catch(() => ""),
};

for (const [name, html] of [
  ["index source", files.indexSource],
  ["cfnf.html", files.cfnf],
  ["printer.html", files.printer],
]) {
  assert.match(html, /id="page-loader"/, `${name} should include the shared loader markup`);
  assert.match(html, /assets-preloader\.js/, `${name} should use the shared preloader script`);
}

assert.match(
  files.indexSource,
  /ASSETS_PRELOAD_URLS/,
  "index source should define explicit landing assets for the shared preloader",
);
assert.match(
  files.indexSource,
  /hero_background\.jpg/,
  "index source should use the single hero background image, not the tiled PNG sheet",
);
assert.doesNotMatch(
  files.indexSource,
  /hero_background\.png/,
  "index source should not use the tiled hero background PNG sheet",
);

assert.match(
  files.printer,
  /ASSETS_BACKGROUND_PRELOAD_URLS/,
  "printer page should preload animation frames in the background on entry",
);

assert.match(
  files.preloader,
  /ASSET_PRELOAD_TIMEOUT_MS/,
  "shared preloader should have an asset timeout to avoid long stalls",
);
assert.match(
  files.preloader,
  /ASSETS_READY_PROMISE/,
  "shared preloader should expose ASSETS_READY_PROMISE for page scripts",
);
assert.match(
  files.preloader,
  /ASSETS_BACKGROUND_READY_PROMISE/,
  "shared preloader should expose background preload progress",
);
assert.match(
  files.preloader,
  /getReader\(\)/,
  "shared preloader should stream large video downloads for smoother progress",
);
assert.match(
  files.preloader,
  /onAssetProgress/,
  "shared preloader should support fractional per-asset progress",
);

await assert.doesNotReject(
  access(".nojekyll"),
  "GitHub Pages should publish underscore-prefixed _astro assets",
);
