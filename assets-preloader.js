(function () {
  const DEFAULT_TIMEOUT_MS = 12000;
  const DEFAULT_BACKGROUND_TIMEOUT_MS = 20000;
  const PRELOAD_TIMEOUT_MS = window.ASSET_PRELOAD_TIMEOUT_MS || DEFAULT_TIMEOUT_MS;
  const BACKGROUND_TIMEOUT_MS =
    window.ASSET_BACKGROUND_PRELOAD_TIMEOUT_MS || DEFAULT_BACKGROUND_TIMEOUT_MS;

  const readyDeferred = {};
  const backgroundDeferred = {};

  window.ASSETS_READY_PROMISE = new Promise((resolve) => {
    readyDeferred.resolve = resolve;
  });
  window.ASSETS_BACKGROUND_READY_PROMISE = new Promise((resolve) => {
    backgroundDeferred.resolve = resolve;
  });

  function toAbsoluteUrl(src) {
    if (!src || src.startsWith("data:") || src.startsWith("blob:")) {
      return null;
    }

    try {
      return new URL(src, window.location.href).href;
    } catch {
      return null;
    }
  }

  function addUrl(urls, src) {
    const absolute = toAbsoluteUrl(src);
    if (absolute) {
      urls.add(absolute);
    }
  }

  function collectStyleUrls(urls) {
    const urlPattern = /url\((['"]?)(.*?)\1\)/g;
    document.querySelectorAll("[style]").forEach((node) => {
      const style = node.getAttribute("style") || "";
      let match;
      while ((match = urlPattern.exec(style))) {
        addUrl(urls, match[2]);
      }
    });
  }

  function collectMediaUrls() {
    const urls = new Set();

    document
      .querySelectorAll("img[src], video[src], source[src]")
      .forEach((node) => addUrl(urls, node.getAttribute("src")));

    collectStyleUrls(urls);

    const explicitUrls = Array.isArray(window.ASSETS_PRELOAD_URLS)
      ? window.ASSETS_PRELOAD_URLS
      : [];
    explicitUrls.forEach((src) => addUrl(urls, src));

    return Array.from(urls);
  }

  function getBackgroundUrls() {
    const explicitUrls = Array.isArray(window.ASSETS_BACKGROUND_PRELOAD_URLS)
      ? window.ASSETS_BACKGROUND_PRELOAD_URLS
      : [];
    const urls = new Set();
    explicitUrls.forEach((src) => addUrl(urls, src));
    return Array.from(urls);
  }

  function withTimeout(promise, timeoutMs, url) {
    let timer = null;
    const timeout = new Promise((resolve) => {
      timer = window.setTimeout(() => {
        resolve({ status: "timeout", url });
      }, timeoutMs);
    });

    return Promise.race([promise, timeout]).finally(() => {
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    });
  }

  async function readResponseBody(response, onProgress) {
    const totalBytes = Number(response.headers.get("content-length")) || 0;
    if (!response.body || totalBytes <= 0) {
      await response.arrayBuffer();
      onProgress(1);
      return;
    }

    const reader = response.body.getReader();
    let loadedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      loadedBytes += value.byteLength;
      onProgress(Math.min(0.98, loadedBytes / totalBytes));
    }

    onProgress(1);
  }

  function loadAsset(url, timeoutMs, onProgress) {
    const loadPromise = new Promise((resolve) => {
      if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(url)) {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
        fetch(url, { cache: "force-cache", signal: controller.signal })
          .then(async (response) => {
            if (!response.ok) {
              resolve({ status: "error", url });
              return;
            }

            await readResponseBody(response, onProgress);
            resolve({ status: "loaded", url });
          })
          .catch((error) => {
            resolve({
              status: error && error.name === "AbortError" ? "timeout" : "error",
              url,
            });
          })
          .finally(() => window.clearTimeout(timeoutId));
        return;
      }

      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve({ status: "loaded", url });
      img.onerror = () => resolve({ status: "error", url });
      img.src = url;
    });

    return withTimeout(loadPromise, timeoutMs, url);
  }

  function preloadUrls(urls, options) {
    const timeoutMs = options.timeoutMs;
    const concurrency = Math.max(1, options.concurrency);
    const onProgress = options.onProgress || (() => {});
    const onAssetProgress = options.onAssetProgress || (() => {});
    const results = [];
    let cursor = 0;

    async function worker() {
      while (cursor < urls.length) {
        const currentIndex = cursor;
        cursor += 1;
        const result = await loadAsset(urls[currentIndex], timeoutMs, (fraction) => {
          onAssetProgress(currentIndex, fraction);
        });
        results[currentIndex] = result;
        onProgress(result, currentIndex);
      }
    }

    const workerCount = Math.min(concurrency, Math.max(1, urls.length));
    return Promise.all(
      Array.from({ length: workerCount }, () => worker()),
    ).then(() => results);
  }

  function setProgress(valueEl, barEl, done, total) {
    const pct = Math.max(0, Math.min(100, Math.round((done / total) * 100)));
    if (valueEl) {
      valueEl.textContent = `${pct}%`;
    }
    if (barEl) {
      barEl.style.width = `${pct}%`;
    }
  }

  function hideLoader(loaderEl) {
    window.ASSETS_PRELOADED_FULL = true;
    document.documentElement.dataset.assetsPreloadReady = "true";
    if (loaderEl) {
      loaderEl.classList.add("is-hidden");
      window.setTimeout(() => loaderEl.remove(), 380);
    }
    document.body.classList.remove("is-loading");
  }

  function preloadBackground(urls) {
    document.documentElement.dataset.assetsBackgroundCount = String(urls.length);
    if (urls.length === 0) {
      window.ASSETS_BACKGROUND_PRELOADED_FULL = true;
      document.documentElement.dataset.assetsBackgroundReady = "true";
      backgroundDeferred.resolve([]);
      return;
    }

    preloadUrls(urls, {
      timeoutMs: BACKGROUND_TIMEOUT_MS,
      concurrency: Math.min(6, Math.max(2, navigator.hardwareConcurrency || 4)),
    }).then((results) => {
      window.ASSETS_BACKGROUND_PRELOADED_FULL = true;
      window.ASSETS_BACKGROUND_PRELOAD_RESULTS = results;
      document.documentElement.dataset.assetsBackgroundReady = "true";
      backgroundDeferred.resolve(results);
    });
  }

  function initPreloader() {
    const loaderEl = document.getElementById("page-loader");
    const valueEl = document.getElementById("page-loader-value");
    const barEl = document.getElementById("page-loader-bar");
    const targets = collectMediaUrls();
    const backgroundTargets = getBackgroundUrls();
    const hasFonts = !!(document.fonts && document.fonts.ready);
    const total = Math.max(1, targets.length);
    const progressFractions = new Array(targets.length).fill(0);

    window.ASSETS_PRELOAD_TARGETS = targets;
    window.ASSETS_BACKGROUND_PRELOAD_TARGETS = backgroundTargets;
    window.ASSETS_PRELOADER_STATE = {
      blockingCount: targets.length,
      backgroundCount: backgroundTargets.length,
      timeoutMs: PRELOAD_TIMEOUT_MS,
      backgroundTimeoutMs: BACKGROUND_TIMEOUT_MS,
    };
    document.documentElement.dataset.assetsPreloadCount = String(targets.length);
    document.documentElement.dataset.assetsBackgroundCount = String(
      backgroundTargets.length,
    );
    document.documentElement.dataset.assetsPreloadTimeout = String(PRELOAD_TIMEOUT_MS);

    if (loaderEl) {
      document.body.classList.add("is-loading");
    }

    function setAssetProgress(index, fraction) {
      if (index < 0 || index >= progressFractions.length) {
        return;
      }

      progressFractions[index] = Math.max(
        progressFractions[index],
        Math.min(1, Math.max(0, fraction)),
      );
      const completedUnits = progressFractions.reduce((sum, value) => sum + value, 0);
      setProgress(valueEl, barEl, completedUnits, total);
    }

    function markDone(_result, index) {
      setAssetProgress(index, 1);
    }

    if (hasFonts) {
      withTimeout(
        document.fonts.ready.then(() => ({ status: "loaded", url: "fonts" })),
        PRELOAD_TIMEOUT_MS,
        "fonts",
      ).then((result) => {
        document.documentElement.dataset.assetsFontsReady = result.status;
      });
    }

    setProgress(valueEl, barEl, 0, total);

    preloadUrls(targets, {
      timeoutMs: PRELOAD_TIMEOUT_MS,
      concurrency: Math.min(16, Math.max(8, navigator.hardwareConcurrency || 8)),
      onAssetProgress: setAssetProgress,
      onProgress: markDone,
    })
      .then((results) => {
        window.ASSETS_PRELOAD_RESULTS = results;
        return results;
      })
      .catch(() => [])
      .then((results) => {
        setProgress(valueEl, barEl, total, total);
        hideLoader(loaderEl);
        readyDeferred.resolve(results);
        preloadBackground(backgroundTargets);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPreloader, { once: true });
  } else {
    initPreloader();
  }
})();
