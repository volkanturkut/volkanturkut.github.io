const root = document.documentElement;
const RENDERER_TIMEOUT_MS = 30_000;

function showFallback(error) {
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

function observeRendererCanvas(timeoutId) {
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
      window.clearTimeout(timeoutId);
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
      window.clearTimeout(timeoutId);
      observer.disconnect();
    }
  }

  return observer;
}

async function startArtwork() {
  // Keep unsupported browsers lightweight: don't install the frame-rate
  // governor or download any rendering dependencies when WebGL is absent.
  if (!hasWebGLApis()) {
    showFallback();
    return;
  }

  // Start the watchdog before importing large runtime files. A stalled load
  // should never leave an empty black page forever on a slow device.
  const timeoutId = window.setTimeout(() => {
    const canvas = document.querySelector("canvas#scene");
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      showFallback(new Error("The renderer did not create a usable canvas within 30 seconds."));
      canvasObserver.disconnect();
    }
  }, RENDERER_TIMEOUT_MS);
  const canvasObserver = observeRendererCanvas(timeoutId);

  try {
    // Install hardware-aware limits before initializing the renderer. This
    // module is intentionally lazy so the no-WebGL shell does minimal work.
    const { initializePerformanceProfile } = await import("./performance.js");
    initializePerformanceProfile();
    await import("./three.r157.min.js");
    await loadClassicScript("./fxhash.min.js");
    await import("./bundle.min.js");
  } catch (error) {
    window.clearTimeout(timeoutId);
    canvasObserver.disconnect();
    showFallback(error);
  }
}

await startArtwork();
