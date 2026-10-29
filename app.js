const root = document.documentElement;
const RENDERER_TIMEOUT_MS = 30_000;

function showFallback(error) {
  // Prevent queued animation callbacks from continuing to spend CPU after fallback.
  window.__ENTANGLED_STOP_RENDERING__ = true;
  root.classList.remove("webgl-ready");
  if (error) {
    window.__ENTANGLED_LOAD_ERROR__ = String(error.stack || error.message || error);
  }
  root.classList.add("no-webgl");
}

function hasWebGLApis() {
  return typeof window.WebGLRenderingContext === "function" ||
    typeof window.WebGL2RenderingContext === "function";
}

function loadClassicScript(path) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL(path, import.meta.url).href;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${path}`));
    document.head.append(script);
  });
}

function observeRendererCanvas() {
  const decoratedCanvases = new WeakSet();
  const decorateCanvas = (canvas) => {
    if (decoratedCanvases.has(canvas)) return;
    decoratedCanvases.add(canvas);
    canvas.setAttribute("aria-hidden", "true");
    canvas.setAttribute("role", "presentation");
    canvas.tabIndex = -1;
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      showFallback(new Error("The WebGL context was lost."));
    }, { once: true });
  };

  const observer = new MutationObserver(() => {
    const canvas = document.querySelector("canvas#scene");
    if (!canvas) return;

    decorateCanvas(canvas);
    if (canvas.width > 0 && canvas.height > 0) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["width", "height"]
  });

  const existingCanvas = document.querySelector("canvas#scene");
  if (existingCanvas) {
    decorateCanvas(existingCanvas);
    if (existingCanvas.width > 0 && existingCanvas.height > 0) {
      observer.disconnect();
    }
  }

  return observer;
}

function installResponsiveResizeSupport() {
  // Mobile browser chrome and device rotation can change the visible viewport
  // without producing a useful window resize event on every browser.
  let resizeTimer = 0;
  const queueResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        window.dispatchEvent(new Event("resize"));
      }
    }, 100);
  };

  window.visualViewport?.addEventListener("resize", queueResize, { passive: true });
  window.addEventListener("orientationchange", queueResize, { passive: true });
  window.addEventListener("pageshow", queueResize, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") queueResize();
  });
  return queueResize;
}

function revealAfterFirstRender(timeoutId, canvasObserver) {
  const checkForRenderedFrames = () => {
    if (window.__ENTANGLED_STOP_RENDERING__) return;

    const canvas = document.querySelector("canvas#scene");
    const hasRenderedFrames = Number(window.__ENTANGLED_PERF__?.frameCount || 0) >= 3;
    if (canvas && canvas.width > 0 && canvas.height > 0 && hasRenderedFrames) {
      window.clearTimeout(timeoutId);
      canvasObserver.disconnect();
      root.classList.remove("no-webgl");
      root.classList.add("webgl-ready");
      return;
    }

    window.requestAnimationFrame(checkForRenderedFrames);
  };

  window.requestAnimationFrame(checkForRenderedFrames);
}

async function startArtwork() {
  // Keep unsupported browsers lightweight: don't install the frame-rate
  // governor or download any rendering dependencies when WebGL is absent.
  if (!hasWebGLApis()) {
    showFallback();
    return;
  }

  let startupTimedOut = false;
  const canvasObserver = observeRendererCanvas();
  // A sized canvas is not enough: wait for actual animation callbacks before
  // dismissing the instant CSS artwork or stopping the loading watchdog.
  const timeoutId = window.setTimeout(() => {
    const canvas = document.querySelector("canvas#scene");
    const rendererStarted = Boolean(
      canvas &&
      canvas.width > 0 &&
      canvas.height > 0 &&
      window.__ENTANGLED_PERF__?.frameCount >= 3
    );

    if (!rendererStarted) {
      startupTimedOut = true;
      showFallback(new Error("The renderer did not begin rendering within 30 seconds."));
    }

    canvasObserver.disconnect();
  }, RENDERER_TIMEOUT_MS);

  try {
    // Install conservative limits before loading the renderer. The module stays
    // unloaded on unsupported browsers, keeping their fallback path lightweight.
    const { initializePerformanceProfile } = await import("./performance.js");
    if (startupTimedOut) return;
    initializePerformanceProfile();
    const queueResize = installResponsiveResizeSupport();

    // Download independent dependencies together to reduce time-to-first-art.
    // The generator itself is imported only after both globals are ready.
    const threePromise = import("./three.r157.min.js");
    const fxhashPromise = loadClassicScript("./fxhash.min.js");
    await Promise.all([threePromise, fxhashPromise]);
    if (startupTimedOut) return;

    await import("./bundle.min.js");
    if (startupTimedOut) return;

    queueResize();
    revealAfterFirstRender(timeoutId, canvasObserver);
  } catch (error) {
    window.clearTimeout(timeoutId);
    canvasObserver.disconnect();
    if (!startupTimedOut) showFallback(error);
  }
}

await startArtwork();
