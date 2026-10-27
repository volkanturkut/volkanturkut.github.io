const MAX_RENDER_PIXELS = 1_000_000;
const LOW_RESOURCE_PARTICLES = 16_384;
const STANDARD_PARTICLES = 32_768;

/**
 * Install a conservative rendering profile before loading the artwork.
 * Native ES modules let these source files run directly in any modern browser:
 * no framework, package manager, bundler, or external runtime is needed.
 */
export function initializePerformanceProfile() {
  const nativeDevicePixelRatio = () => Number(window.devicePixelRatio) || 1;
  const cores = Number(navigator.hardwareConcurrency) || 0;
  const memory = Number(navigator.deviceMemory) || 0;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const lowResource =
    (cores > 0 && cores <= 4) ||
    (memory > 0 && memory <= 4) ||
    (coarsePointer && cores > 0 && cores <= 6) ||
    (!cores && !memory);

  const particleCount = lowResource ? LOW_RESOURCE_PARTICLES : STANDARD_PARTICLES;
  const maxDevicePixelRatio = lowResource ? 1.0 : 1.25;
  const getRenderScale = () => Math.min(
    maxDevicePixelRatio,
    nativeDevicePixelRatio(),
    Math.sqrt(MAX_RENDER_PIXELS / Math.max(1, window.innerWidth * window.innerHeight))
  );

  window.__ENTANGLED_PERF_PARTICLES__ = particleCount;

  // Keep the browser's native devicePixelRatio intact. The tuned renderer
  // reads this private, resize-aware scale to limit WebGL work.
  try {
    Object.defineProperty(window, "__ENTANGLED_RENDER_SCALE__", {
      configurable: true,
      get: getRenderScale
    });
  } catch {
    window.__ENTANGLED_RENDER_SCALE__ = getRenderScale();
    window.addEventListener("resize", () => {
      window.__ENTANGLED_RENDER_SCALE__ = getRenderScale();
    }, { passive: true });
  }

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const getTargetFrameRate = () => reducedMotionQuery.matches
    ? 15
    : lowResource ? 24 : 30;
  const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
  let lastFrameTimestamp = Number.NEGATIVE_INFINITY;
  let renderedFrameCount = 0;

  // Maintain compositor-aligned animation while limiting how often the
  // expensive generator is allowed to update.
  window.requestAnimationFrame = (callback) => nativeRequestAnimationFrame((timestamp) => {
    const minimumFrameInterval = 1000 / getTargetFrameRate();
    if (timestamp - lastFrameTimestamp < minimumFrameInterval) {
      window.requestAnimationFrame(callback);
      return;
    }

    lastFrameTimestamp = timestamp;
    renderedFrameCount += 1;
    callback(timestamp);
  });

  reducedMotionQuery.addEventListener?.("change", () => {
    lastFrameTimestamp = Number.NEGATIVE_INFINITY;
  });

  window.__ENTANGLED_PERF__ = Object.freeze({
    build: "low-end-r12",
    particleCount,
    hardwareClass: lowResource ? "low" : "standard",
    lowResource,
    maxDevicePixelRatio,
    renderPixelBudget: MAX_RENDER_PIXELS,
    get targetFramesPerSecond() { return getTargetFrameRate(); },
    get reducedMotion() { return reducedMotionQuery.matches; },
    get renderScale() { return getRenderScale(); },
    multiWindow: false,
    pointerControls: false,
    keyboardShortcuts: false,
    get frameCount() { return renderedFrameCount; }
  });
}
