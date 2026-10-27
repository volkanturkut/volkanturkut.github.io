import { initializePerformanceProfile } from "./performance.js";

initializePerformanceProfile();

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
  const decorateCanvas = (canvas) => {
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
    }
  }, RENDERER_TIMEOUT_MS);
  const canvasObserver = observeRendererCanvas(timeoutId);

  try {
    // Expensive local runtimes are only loaded when WebGL APIs are present.
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
