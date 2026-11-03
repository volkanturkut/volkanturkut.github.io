# Volkan Turkut

A minimal, free-to-host personal portfolio with generative artwork and accessible social links.

## Modern source layout

The page uses native browser technologies: semantic HTML, a separate responsive stylesheet, and native ECMAScript modules. It does not require a framework, package manager, bundler, runtime CDN, analytics, or paid service.

- `index.html` — semantic document shell, metadata, and accessible footer.
- `styles.css` — responsive layout, safe-area spacing, keyboard focus styling, higher-contrast artwork, readable footer text, and a clean black fallback.
- `app.js` — WebGL capability checks, parallel runtime loading, mobile viewport resize recovery, canvas accessibility, context-loss handling, and a first-frame watchdog.
- `performance.js` — device-aware particle and resolution limits, animation scheduling, and reduced-motion support.
- `bundle.min.js` — performance-tuned derivative of the original Entangled generator.
- `fxhash.min.js` and `three.r157.min.js` — local runtime dependencies required by the original visual.

The preserved upstream source files remain unchanged under [original-source/versions/v0-original-entangled](./original-source/versions/v0-original-entangled).

## Performance profile

- Particle workload adapts to device capabilities: 8,192 particles on touch/low-resource devices and 32,768 on standard devices. Touch devices always use the conservative profile.
- WebGL render scale is capped at 1.0 on low-resource devices and 1.25 on standard devices, with a 600,000-pixel budget on touch/low-resource devices and a one-megapixel budget on standard devices.
- Animation callbacks are capped at 20 FPS on touch/low-resource devices and 30 FPS on standard devices, or 15 FPS when reduced motion is requested. Hidden tabs skip generator work, and fallback activation stops queued animation callbacks.
- Multi-window synchronization, pointer/touch controls, keyboard shortcuts, and diagnostic feature dumps are disabled.
- Independent renderer dependencies download in parallel after WebGL detection, reducing serial startup waits. The page paints a clean black surface immediately; the actual artwork is revealed as soon as the renderer produces its first frames. The local generator bundle is preloaded in parallel with its dependencies.
- Window and artwork-element resizes are observed; mobile visual-viewport, orientation, and tab-visibility changes prompt one settled resize. Particle drawing pauses briefly while buffers are resized to prevent mobile GPU stalls.
- Artwork saturation and contrast are boosted, and footer text is larger and lighter for better legibility on weaker displays.
- A clean black fallback remains if JavaScript is disabled, WebGL is unavailable, the renderer fails, the context is lost, or initialization times out. No decorative loading orb is drawn. The watchdog requires a sized canvas and a scheduled frame before treating rendering as started.

The design prioritizes bounded rendering work rather than claiming a guaranteed FPS on every GPU, browser, thermal state, or power setting. CI exercises desktop, phone-sized, tablet-sized, and large-monitor profiles, but does not replace testing on physical devices.

## Free hosting

This repository is named `volkanturkut.github.io`; the live site is **https://volkanturkut.github.io/**. GitHub Pages serves the static files for free without a build step.

## Checks and provenance

- [Original source and performance audit](./ORIGINAL_SOURCE_AUDIT.md)
- [Third-party notices](./THIRD_PARTY_NOTICES.md)
- [Browser smoke workflow](./.github/workflows/browser-smoke.yml)
- [Source verification workflow](./.github/workflows/verify-original-source.yml)

The original artwork and production bundle are © Bjørn Staal (@nonfigurativ), *Entangled*, fxhash VERTEX (2024). All rights remain with the artist; the site does not claim authorship or ownership. See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## Customize

Edit `index.html` for page metadata and footer content, `styles.css` for layout, or `performance.js` for hardware budgets. The tuned artwork runtime is `bundle.min.js`; compare it with the pristine source archive before changing rendering behavior.
